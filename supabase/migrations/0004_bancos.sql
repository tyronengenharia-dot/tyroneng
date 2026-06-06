-- =============================================================================
-- 0004 — Módulo Bancos (centrais de conta + movimentações + transferências)
-- Controle de gastos/caixa por conta da empresa (tesouraria).
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) via SQL Editor
-- ou `supabase db push`. NÃO usar o conector MCP de outro projeto.
--
-- Convenções (seguindo o banco atual): id uuid default gen_random_uuid(),
-- created_at/updated_at timestamptz default now(), snake_case, FK para obras(id).
-- RLS ligado + policy permissiva anon/authenticated (o app usa a anon key sem
-- auth por usuário, igual ao restante do sistema — ver 0002).
-- =============================================================================

create extension if not exists pgcrypto;

-- set_updated_at() já é criada em 0001; recriada aqui para a migration ser
-- auto-suficiente caso rode isolada.
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. CONTAS — as "centrais de conta": banco, caixa, aplicação, cartão...
-- -----------------------------------------------------------------------------
create table if not exists bancos_contas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  tipo          text not null default 'corrente'
                check (tipo in ('corrente','poupanca','caixa','aplicacao','cartao','investimento')),
  banco         text,
  agencia       text,
  numero_conta  text,
  titular       text,
  saldo_inicial numeric(14,2) not null default 0,
  cor           text not null default '#3b82f6',
  ativo         boolean not null default true,
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. CATEGORIAS — organização dos lançamentos (centro de custo simples)
-- -----------------------------------------------------------------------------
create table if not exists bancos_categorias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  tipo       text not null default 'saida' check (tipo in ('entrada','saida','ambos')),
  cor        text not null default '#6b7280',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. MOVIMENTAÇÕES — cada lançamento de uma conta (entrada/saída)
--    valor é sempre positivo; o sinal vem de `tipo`.
--    status: previsto (agendado) | pago (realizado) | conciliado (batido c/ extrato)
--    transferencia_id liga as duas pernas de uma transferência entre contas.
-- -----------------------------------------------------------------------------
create table if not exists bancos_movimentacoes (
  id               uuid primary key default gen_random_uuid(),
  conta_id         uuid not null references bancos_contas(id) on delete cascade,
  tipo             text not null check (tipo in ('entrada','saida')),
  data             date not null default current_date,
  valor            numeric(14,2) not null check (valor > 0),
  descricao        text not null,
  categoria_id     uuid references bancos_categorias(id) on delete set null,
  obra_id          uuid references obras(id) on delete set null,
  beneficiario     text,  -- fornecedor / favorecido / pagador (texto livre)
  forma_pagamento  text check (forma_pagamento in
                     ('pix','ted','doc','dinheiro','boleto','cartao','cheque','transferencia','outro')),
  documento        text,  -- nº da nota fiscal / comprovante
  status           text not null default 'pago' check (status in ('previsto','pago','conciliado')),
  data_conciliacao date,
  transferencia_id uuid,
  anexo_url        text,
  observacoes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists ix_bancos_mov_conta         on bancos_movimentacoes (conta_id);
create index if not exists ix_bancos_mov_data          on bancos_movimentacoes (data);
create index if not exists ix_bancos_mov_obra          on bancos_movimentacoes (obra_id);
create index if not exists ix_bancos_mov_categoria     on bancos_movimentacoes (categoria_id);
create index if not exists ix_bancos_mov_transferencia on bancos_movimentacoes (transferencia_id);
create index if not exists ix_bancos_mov_status        on bancos_movimentacoes (status);

-- triggers updated_at
drop trigger if exists trg_bancos_contas_updated on bancos_contas;
create trigger trg_bancos_contas_updated before update on bancos_contas
  for each row execute function set_updated_at();

drop trigger if exists trg_bancos_mov_updated on bancos_movimentacoes;
create trigger trg_bancos_mov_updated before update on bancos_movimentacoes
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. VIEW de saldos por conta
--    saldo_atual    = saldo_inicial + Σ realizados (pago/conciliado)
--    saldo_previsto = saldo_inicial + Σ todos (inclui previstos)
-- -----------------------------------------------------------------------------
create or replace view bancos_contas_saldo as
select
  c.id, c.nome, c.tipo, c.banco, c.agencia, c.numero_conta, c.titular,
  c.saldo_inicial, c.cor, c.ativo, c.observacoes, c.created_at, c.updated_at,
  (c.saldo_inicial + coalesce(sum(
    case when m.status in ('pago','conciliado')
         then case when m.tipo = 'entrada' then m.valor else -m.valor end
         else 0 end), 0))::numeric(14,2) as saldo_atual,
  (c.saldo_inicial + coalesce(sum(
    case when m.tipo = 'entrada' then m.valor else -m.valor end), 0))::numeric(14,2) as saldo_previsto,
  coalesce(sum(case when m.status = 'previsto' then 1 else 0 end), 0)::int as qtd_previstos,
  coalesce(sum(case when m.status in ('pago','conciliado') then 1 else 0 end), 0)::int as qtd_realizados
from bancos_contas c
left join bancos_movimentacoes m on m.conta_id = c.id
group by c.id;

-- -----------------------------------------------------------------------------
-- 5. RPC — transferência entre contas (cria as duas pernas atomicamente)
-- -----------------------------------------------------------------------------
create or replace function transferir_entre_contas(
  p_origem    uuid,
  p_destino   uuid,
  p_valor     numeric,
  p_data      date,
  p_descricao text default null,
  p_status    text default 'pago'
) returns uuid
language plpgsql as $$
declare
  v_transf uuid := gen_random_uuid();
  v_desc   text := coalesce(nullif(trim(p_descricao), ''), 'Transferência entre contas');
begin
  if p_origem = p_destino then
    raise exception 'Conta de origem e destino devem ser diferentes';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor da transferência deve ser maior que zero';
  end if;

  insert into bancos_movimentacoes
    (conta_id, tipo, data, valor, descricao, status, forma_pagamento, transferencia_id)
  values
    (p_origem, 'saida', coalesce(p_data, current_date), p_valor, v_desc, p_status, 'transferencia', v_transf);

  insert into bancos_movimentacoes
    (conta_id, tipo, data, valor, descricao, status, forma_pagamento, transferencia_id)
  values
    (p_destino, 'entrada', coalesce(p_data, current_date), p_valor, v_desc, p_status, 'transferencia', v_transf);

  return v_transf;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. RLS + grants (o Supabase religa RLS em tabelas novas; abrimos com policy
--    permissiva, como em 0002).
-- -----------------------------------------------------------------------------
alter table bancos_contas        enable row level security;
alter table bancos_categorias    enable row level security;
alter table bancos_movimentacoes enable row level security;

drop policy if exists bancos_contas_anon_all on bancos_contas;
create policy bancos_contas_anon_all on bancos_contas
  for all to anon, authenticated using (true) with check (true);

drop policy if exists bancos_categorias_anon_all on bancos_categorias;
create policy bancos_categorias_anon_all on bancos_categorias
  for all to anon, authenticated using (true) with check (true);

drop policy if exists bancos_mov_anon_all on bancos_movimentacoes;
create policy bancos_mov_anon_all on bancos_movimentacoes
  for all to anon, authenticated using (true) with check (true);

grant all on bancos_contas        to anon, authenticated, service_role;
grant all on bancos_categorias    to anon, authenticated, service_role;
grant all on bancos_movimentacoes to anon, authenticated, service_role;
grant select on bancos_contas_saldo to anon, authenticated, service_role;
grant execute on function transferir_entre_contas(uuid, uuid, numeric, date, text, text)
  to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. Seed de categorias comuns (idempotente)
-- -----------------------------------------------------------------------------
insert into bancos_categorias (nome, tipo, cor) values
  ('Materiais',            'saida',   '#3b82f6'),
  ('Mão de obra',          'saida',   '#f59e0b'),
  ('Equipamentos',         'saida',   '#10b981'),
  ('Folha de pagamento',   'saida',   '#8b5cf6'),
  ('Impostos e taxas',     'saida',   '#ef4444'),
  ('Aluguel',              'saida',   '#ec4899'),
  ('Combustível',          'saida',   '#f97316'),
  ('Serviços de terceiros','saida',   '#14b8a6'),
  ('Despesas administrativas','saida','#64748b'),
  ('Receita de obra',      'entrada', '#22c55e'),
  ('Aporte / Capital',     'entrada', '#06b6d4'),
  ('Transferência',        'ambos',   '#6b7280'),
  ('Outros',               'ambos',   '#94a3b8')
on conflict (nome) do nothing;
