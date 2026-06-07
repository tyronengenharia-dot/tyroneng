-- =============================================================================
-- 0011 — Integração Compras ↔ Insumos ↔ Estoque
--
-- Liga o setor de Compras ao catálogo de Insumos (cumpre a intenção da 0001:
-- "insumos é abastecido pelo setor de compras"). Ao CONFIRMAR a entrega
-- (entregas.status -> 'entregue'), em uma única transação o sistema:
--   1. atualiza o preço de referência do insumo (insumos.valor_unitario);
--   2. cria o insumo no catálogo se a compra não estava vinculada a um;
--   3. dá entrada no estoque físico (materiais.quantidade += quantidade comprada).
--
-- Aplicar no Supabase DESTE projeto (SQL Editor ou `supabase db push`).
-- NÃO usar o conector MCP de outro projeto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Colunas de vínculo (nullable -> compatível com linhas já existentes).
--    O insumo_id nasce na solicitação, é copiado para o pedido e é lido na
--    confirmação da entrega.
-- -----------------------------------------------------------------------------
alter table solicitacoes_compra
  add column if not exists insumo_id uuid references insumos(id) on delete set null;

alter table pedidos_compra
  add column if not exists insumo_id uuid references insumos(id) on delete set null;

alter table materiais
  add column if not exists insumo_id uuid references insumos(id) on delete set null;

-- Um material por insumo: permite o upsert por insumo_id no trigger.
-- Índice parcial -> não conflita com materiais antigos sem vínculo.
create unique index if not exists uq_materiais_insumo
  on materiais (insumo_id) where insumo_id is not null;

-- -----------------------------------------------------------------------------
-- 2. Sequence para o código de insumo auto-criado pela compra (CMP-00001...).
-- -----------------------------------------------------------------------------
create sequence if not exists insumos_auto_codigo_seq;

-- -----------------------------------------------------------------------------
-- 3. Função: aplica a entrega no catálogo (insumos) e no estoque (materiais).
--    Roda só na transição para 'entregue' -> idempotente (não duplica estoque
--    se a linha for salva de novo).
--
--    OBS sobre RLS: se houver policies restritivas bloqueando os INSERT/UPDATE
--    em insumos/materiais a partir do trigger, troque para SECURITY DEFINER
--    (a função roda com os privilégios do owner). Mantido SECURITY INVOKER
--    (padrão) para seguir o estilo das funções da 0001.
-- -----------------------------------------------------------------------------
create or replace function aplicar_entrega_em_insumo() returns trigger
language plpgsql as $$
declare
  v_pedido    pedidos_compra%rowtype;
  v_insumo_id uuid;
  v_qtd       numeric;
begin
  -- dispara apenas quando o status MUDA para 'entregue'
  if new.status is distinct from 'entregue'
     or old.status is not distinct from 'entregue' then
    return new;
  end if;

  -- pedido vinculado à entrega (traz qtd, unidade, valor e descrição)
  select * into v_pedido from pedidos_compra where id = new.pedido_id;
  if not found then
    return new;
  end if;

  v_insumo_id := v_pedido.insumo_id;
  v_qtd       := coalesce(v_pedido.quantidade, 0);

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

    -- estampa o vínculo de volta (rastreabilidade do que originou o insumo)
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
       set quantidade      = quantidade + v_qtd,
           valor_unitario  = coalesce(v_pedido.valor_unitario, valor_unitario)
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

drop trigger if exists trg_aplicar_entrega_em_insumo on entregas;
create trigger trg_aplicar_entrega_em_insumo
  after update on entregas
  for each row
  execute function aplicar_entrega_em_insumo();
