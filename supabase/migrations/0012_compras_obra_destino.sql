-- =============================================================================
-- 0012 — Compras ↔ Obras (origem do pedido + destino da entrega)
--
-- Liga o setor de Compras às obras. Depende da 0011 (integração Compras↔Insumos
-- ↔Estoque): APLIQUE A 0011 ANTES desta. Esta migration acrescenta:
--   * origem  -> a solicitação/pedido pode nascer de uma obra específica
--                (ou "Geral/Empresa", quando obra_id fica vazio/NULL);
--   * destino -> o material entregue vai para uma OBRA específica OU para o
--                DEPÓSITO da empresa (entrega_tipo).
--
-- Ao CONFIRMAR a entrega (entregas.status -> 'entregue'), o trigger passa a
-- ROTEAR conforme o destino do pedido:
--   * DEPÓSITO (entrega_tipo NULL/'deposito'): comportamento da 0011 — atualiza
--     o preço do insumo, cria o insumo se necessário e dá entrada no estoque
--     físico central (materiais).
--   * OBRA (entrega_tipo='obra' + planilha_item_id): NÃO passa pelo depósito;
--     lança o custo como parcela de Custo Real da obra (custo_real_pagamentos),
--     com status 'pendente' (comprometido) — a conciliação financeira (conta +
--     comprovante => 'pago') é feita depois no módulo de Custo Real. Isso respeita
--     a regra "toda saída nasce de um item do Custo Real" e não exige conta
--     bancária no momento da entrega (não afeta saldo até ser marcada como paga).
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) via SQL Editor ou
-- `supabase db push`. NÃO usar o conector MCP de outro projeto. Idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Colunas de origem/destino (nullable -> compatível com linhas existentes).
--    Fluxo: nascem na solicitação -> copiadas para o pedido -> lidas na entrega.
--    Obs.: solicitacoes_compra.obra_id (origem) já existe e continua sendo a obra
--    solicitante; vazio/NULL = compra "Geral / Empresa".
-- -----------------------------------------------------------------------------
alter table solicitacoes_compra
  add column if not exists entrega_tipo     text,
  add column if not exists entrega_obra_id  uuid references obras(id)          on delete set null,
  add column if not exists planilha_item_id uuid references planilha_itens(id) on delete set null;

alter table pedidos_compra
  add column if not exists obra_id          text,
  add column if not exists entrega_tipo     text,
  add column if not exists entrega_obra_id  uuid references obras(id)          on delete set null,
  add column if not exists planilha_item_id uuid references planilha_itens(id) on delete set null;

-- entrega_tipo só aceita os dois valores conhecidos (NULL = depósito por padrão).
alter table solicitacoes_compra drop constraint if exists chk_solic_entrega_tipo;
alter table solicitacoes_compra add constraint chk_solic_entrega_tipo
  check (entrega_tipo is null or entrega_tipo in ('obra','deposito'));

alter table pedidos_compra drop constraint if exists chk_pedido_entrega_tipo;
alter table pedidos_compra add constraint chk_pedido_entrega_tipo
  check (entrega_tipo is null or entrega_tipo in ('obra','deposito'));

create index if not exists ix_solic_entrega_obra on solicitacoes_compra (entrega_obra_id);
create index if not exists ix_solic_plan_item    on solicitacoes_compra (planilha_item_id);
create index if not exists ix_pedido_entrega_obra on pedidos_compra (entrega_obra_id);
create index if not exists ix_pedido_plan_item    on pedidos_compra (planilha_item_id);

-- -----------------------------------------------------------------------------
-- 2. Trigger de entrega com ROTEAMENTO por destino (substitui a função da 0011).
--    Idempotente: só dispara na transição para 'entregue'.
-- -----------------------------------------------------------------------------
create or replace function aplicar_entrega_em_insumo() returns trigger
language plpgsql as $$
declare
  v_pedido    pedidos_compra%rowtype;
  v_insumo_id uuid;
  v_qtd       numeric;
  v_obra_id   uuid;
begin
  -- dispara apenas quando o status MUDA para 'entregue'
  if new.status is distinct from 'entregue'
     or old.status is not distinct from 'entregue' then
    return new;
  end if;

  -- pedido vinculado à entrega (traz qtd, unidade, valor, descrição e destino)
  select * into v_pedido from pedidos_compra where id = new.pedido_id;
  if not found then
    return new;
  end if;

  v_insumo_id := v_pedido.insumo_id;
  v_qtd       := coalesce(v_pedido.quantidade, 0);

  -- ===========================================================================
  -- ROTA A — entrega numa OBRA: vira Custo Real (NÃO entra no depósito central).
  -- ===========================================================================
  if v_pedido.entrega_tipo = 'obra' and v_pedido.planilha_item_id is not null then
    -- preço de referência do insumo (se houver vínculo) continua atualizado
    if v_insumo_id is not null then
      update insumos
         set valor_unitario = coalesce(v_pedido.valor_unitario, valor_unitario)
       where id = v_insumo_id;
    end if;

    -- obra do item escolhido (garante o FK NOT NULL de custo_real_pagamentos)
    select obra_id into v_obra_id
      from planilha_itens where id = v_pedido.planilha_item_id;

    -- item inexistente: não lança custo "solto" (mantém a invariante do Custo Real)
    if v_obra_id is null then
      return new;
    end if;

    -- comprometido (pendente): a conciliação (conta + comprovante => pago) é feita
    -- depois no módulo de Custo Real. Não afeta o saldo de nenhuma conta ainda.
    insert into custo_real_pagamentos
      (planilha_item_id, obra_id, descricao, valor, data, status)
    values (
      v_pedido.planilha_item_id,
      v_obra_id,
      'Compra: ' || coalesce(v_pedido.descricao_item, 'item')
        || ' — ' || coalesce(v_pedido.fornecedor, 'fornecedor')
        || coalesce(' (NF ' || nullif(new.nf_numero, '') || ')', ''),
      coalesce(v_pedido.valor_final, 0),
      coalesce(new.data_real, current_date),
      'pendente'
    );

    return new;
  end if;

  -- ===========================================================================
  -- ROTA B — entrega no DEPÓSITO (comportamento da 0011): catálogo + estoque.
  -- ===========================================================================
  -- 1/2. Insumo: atualiza o preço de referência ou cria se não existir.
  if v_insumo_id is null then
    insert into insumos (codigo, tipo, descricao, unidade, valor_unitario, ativo)
    values (
      'CMP-' || lpad(nextval('insumos_auto_codigo_seq')::text, 5, '0'),
      'material',
      coalesce(v_pedido.descricao_item, 'Item de compra'),
      coalesce(v_pedido.unidade, 'un'),
      coalesce(v_pedido.valor_unitario, 0),
      true
    )
    returning id into v_insumo_id;

    update pedidos_compra      set insumo_id = v_insumo_id where id = v_pedido.id;
    update solicitacoes_compra set insumo_id = v_insumo_id where id = v_pedido.solicitacao_id;
  else
    update insumos
       set valor_unitario = coalesce(v_pedido.valor_unitario, valor_unitario)
     where id = v_insumo_id;
  end if;

  -- 3. Estoque físico: entrada da quantidade comprada (incremento atômico).
  if v_qtd > 0 then
    update materiais
       set quantidade     = quantidade + v_qtd,
           valor_unitario = coalesce(v_pedido.valor_unitario, valor_unitario)
     where insumo_id = v_insumo_id;

    if not found then
      insert into materiais (nome, unidade, quantidade, valor_unitario, insumo_id)
      values (
        coalesce(v_pedido.descricao_item, 'Item de compra'),
        coalesce(v_pedido.unidade, 'un'),
        v_qtd,
        coalesce(v_pedido.valor_unitario, 0),
        v_insumo_id
      );
    end if;
  end if;

  return new;
end;
$$;

-- O trigger trg_aplicar_entrega_em_insumo (criado na 0011) continua válido —
-- aponta para esta função recém-substituída. Recriado aqui de forma defensiva
-- caso a 0011 ainda não tenha sido aplicada nesta base.
drop trigger if exists trg_aplicar_entrega_em_insumo on entregas;
create trigger trg_aplicar_entrega_em_insumo
  after update on entregas
  for each row
  execute function aplicar_entrega_em_insumo();
