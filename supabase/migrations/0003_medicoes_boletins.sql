-- =============================================================================
-- 0003 — Medições (Boletins de Medição) vinculadas à Planilha de Venda
-- Sistema de gestão de obras (TyronGestão)
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) — SQL Editor ou
-- `supabase db push`. NÃO usar o conector MCP de outro projeto.
-- Depende de 0001 (tabela `planilhas`, função `set_updated_at`, `planilha_itens`).
--
-- O que é uma medição: periodicamente mede-se quanto de cada item do CONTRATO
-- (Planilha de Venda + Aditivos fechados) já foi executado, gerando um Boletim
-- de Medição (BM). É a base do faturamento ao cliente:
--     contratado − medido (acumulado) = saldo a receber.
--
-- Regra (alinhada às travas do sistema): só é possível emitir BM depois que a
-- Venda está 'fechada' (contrato fechado) — imposto em criar_boletim_medicao().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Boletim de Medição (cabeçalho) — uma medição periódica por obra.
-- -----------------------------------------------------------------------------
create table if not exists medicao_boletins (
  id           uuid primary key default gen_random_uuid(),
  obra_id      uuid not null references obras(id) on delete cascade,
  numero       int  not null,                       -- sequencial por obra
  periodo      text,                                -- ex.: 'jul/26'
  data_medicao date not null default current_date,
  status       text not null default 'rascunho'
               check (status in ('rascunho','aprovado','pago')),
  observacao   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (obra_id, numero)
);

create trigger trg_medicao_boletins_updated before update on medicao_boletins
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Linha de medição: quanto de um item do contrato foi medido NESTE boletim.
--    valor_unitario = snapshot do preço contratado no momento da medição
--    (protege o histórico mesmo que o item de origem seja reprecificado).
-- -----------------------------------------------------------------------------
create table if not exists medicao_itens (
  id               uuid primary key default gen_random_uuid(),
  boletim_id       uuid not null references medicao_boletins(id) on delete cascade,
  planilha_item_id uuid not null references planilha_itens(id)   on delete cascade,
  quantidade       numeric(18,6) not null default 0,
  valor_unitario   numeric(14,4) not null default 0,
  created_at       timestamptz not null default now(),
  unique (boletim_id, planilha_item_id)
);

-- -----------------------------------------------------------------------------
-- 3. Emissão de BM (RPC atômica) — Regra: só após a Venda estar 'fechada'.
--    Numera sequencialmente por obra e devolve o id do novo boletim.
-- -----------------------------------------------------------------------------
create or replace function criar_boletim_medicao(
  p_obra_id uuid,
  p_periodo text default null,
  p_data    date default current_date
) returns uuid
language plpgsql security definer as $$
declare
  v_venda_status text;
  v_num          int;
  v_id           uuid;
begin
  select status into v_venda_status
    from planilhas where obra_id = p_obra_id and tipo = 'venda';

  if v_venda_status is distinct from 'fechada' then
    raise exception 'Medição só pode ser emitida após o fechamento da Venda (status: %)',
      coalesce(v_venda_status, 'inexistente');
  end if;

  select coalesce(max(numero), 0) + 1 into v_num
    from medicao_boletins where obra_id = p_obra_id;

  insert into medicao_boletins (obra_id, numero, periodo, data_medicao)
       values (p_obra_id, v_num, p_periodo, p_data)
    returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Índices
-- -----------------------------------------------------------------------------
create index if not exists ix_medicao_boletins_obra on medicao_boletins (obra_id);
create index if not exists ix_medicao_itens_boletim  on medicao_itens (boletim_id);
create index if not exists ix_medicao_itens_pitem    on medicao_itens (planilha_item_id);

-- -----------------------------------------------------------------------------
-- 5. RLS — desabilita (consistente com o módulo de planilhas; travas via app/RPC).
-- -----------------------------------------------------------------------------
alter table medicao_boletins disable row level security;
alter table medicao_itens    disable row level security;
