-- =============================================================================
-- 0006 — Módulo Empréstimos & Consórcios
-- Gestão de contratos de empréstimo (juros sobre saldo, Price, SAC) e consórcios
-- (carta de crédito + taxa de administração), com parcelas/faturas e documentos.
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) via SQL Editor
-- ou `supabase db push`. NÃO usar o conector MCP de outro projeto.
--
-- Convenções (seguindo o banco atual): id uuid default gen_random_uuid(),
-- created_at/updated_at timestamptz default now(), snake_case, FK para obras(id).
-- RLS ligado + policy permissiva anon/authenticated (o app usa a anon key sem
-- auth por usuário, igual ao restante do sistema — ver 0002 e 0004).
--
-- Modelo financeiro (o caso "empréstimo do tio"): regime='juros_saldo' com
-- capitaliza=true ⇒ juros do mês = saldo_devedor × taxa; se a parcela não é paga,
-- o juros não pago entra no saldo (capitaliza) e o mês seguinte rende sobre o novo
-- saldo. A fórmula do ledger por parcela é:
--     saldo_final = saldo_inicial + valor_juros − valor_pago
-- O status da parcela NÃO é armazenado: é derivado de (valor_pago, vencimento, hoje)
-- para nunca ficar defasado.
-- =============================================================================

create extension if not exists pgcrypto;

-- set_updated_at() já é criada em 0001/0004; recriada aqui para a migration ser
-- auto-suficiente caso rode isolada.
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. EMPRESTIMOS — o contrato (empréstimo OU consórcio, via `categoria`)
-- -----------------------------------------------------------------------------
create table if not exists emprestimos (
  id                 uuid primary key default gen_random_uuid(),
  categoria          text not null default 'emprestimo'
                       check (categoria in ('emprestimo','consorcio')),
  descricao          text not null,                 -- apelido do contrato
  credor             text,                          -- quem emprestou / administradora
  proposito          text,                          -- finalidade do empréstimo
  valor_principal    numeric(14,2) not null default 0
                       check (valor_principal >= 0), -- emprestado / carta de crédito
  data_inicio        date not null default current_date,
  data_limite        date,                          -- prazo final para quitar
  dia_vencimento     int check (dia_vencimento between 1 and 31),
  status             text not null default 'ativo'
                       check (status in ('ativo','quitado','inadimplente','cancelado','contemplado')),
  obra_id            uuid references obras(id) on delete set null,

  -- ── Empréstimo: regime de juros ──
  regime             text not null default 'juros_saldo'
                       check (regime in ('juros_saldo','price','sac','sem_juros')),
  taxa_juros_mensal  numeric(9,4) not null default 0
                       check (taxa_juros_mensal >= 0),  -- % ao mês (ex.: 2.0)
  capitaliza         boolean not null default true,     -- juros não pago vira principal
  num_parcelas       int check (num_parcelas is null or num_parcelas > 0),

  -- ── Consórcio ──
  taxa_admin_pct     numeric(9,4) check (taxa_admin_pct is null or taxa_admin_pct >= 0),
  fundo_reserva_pct  numeric(9,4) check (fundo_reserva_pct is null or fundo_reserva_pct >= 0),
  contemplado        boolean not null default false,
  data_contemplacao  date,
  forma_contemplacao text not null default 'nao'
                       check (forma_contemplacao in ('nao','lance','sorteio')),
  valor_lance        numeric(14,2) check (valor_lance is null or valor_lance >= 0),

  cor                text not null default '#8b5cf6',
  observacoes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists ix_emprestimos_categoria on emprestimos (categoria);
create index if not exists ix_emprestimos_status    on emprestimos (status);
create index if not exists ix_emprestimos_obra      on emprestimos (obra_id);

-- -----------------------------------------------------------------------------
-- 2. EMPRESTIMO_PARCELAS — as "faturas" mensais do contrato
--    Cada linha guarda a foto do mês: saldo_inicial, juros, amortização, total
--    devido e saldo_final, além do que foi efetivamente pago.
-- -----------------------------------------------------------------------------
create table if not exists emprestimo_parcelas (
  id                uuid primary key default gen_random_uuid(),
  emprestimo_id     uuid not null references emprestimos(id) on delete cascade,
  numero            int  not null,
  competencia       text,                              -- 'YYYY-MM' (informativo)
  vencimento        date not null,

  -- composição do valor (preenchida pelo motor de cálculo)
  saldo_inicial     numeric(14,2) not null default 0,  -- saldo devedor base do mês
  valor_juros       numeric(14,2) not null default 0,
  valor_amortizacao numeric(14,2) not null default 0,
  valor_total       numeric(14,2) not null default 0,  -- o que deveria ser pago
  saldo_final       numeric(14,2) not null default 0,  -- saldo devedor após o mês

  -- realizado
  valor_pago        numeric(14,2) not null default 0 check (valor_pago >= 0),
  data_pagamento    date,
  forma_pagamento   text check (forma_pagamento in
                      ('pix','ted','doc','dinheiro','boleto','cartao','cheque','transferencia','outro')),
  comprovante_url   text,
  comprovante_path  text,
  observacoes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (emprestimo_id, numero)
);

create index if not exists ix_emp_parcelas_emprestimo on emprestimo_parcelas (emprestimo_id);
create index if not exists ix_emp_parcelas_vencimento on emprestimo_parcelas (vencimento);

-- -----------------------------------------------------------------------------
-- 3. EMPRESTIMO_DOCUMENTOS — contrato, garantias, comprovantes avulsos...
-- -----------------------------------------------------------------------------
create table if not exists emprestimo_documentos (
  id            uuid primary key default gen_random_uuid(),
  emprestimo_id uuid not null references emprestimos(id) on delete cascade,
  nome          text not null,
  tipo          text not null default 'outro'
                  check (tipo in ('contrato','comprovante','garantia','aditivo','identidade','outro')),
  url           text not null,
  path          text,
  created_at    timestamptz not null default now()
);

create index if not exists ix_emp_docs_emprestimo on emprestimo_documentos (emprestimo_id);

-- triggers updated_at
drop trigger if exists trg_emprestimos_updated on emprestimos;
create trigger trg_emprestimos_updated before update on emprestimos
  for each row execute function set_updated_at();

drop trigger if exists trg_emp_parcelas_updated on emprestimo_parcelas;
create trigger trg_emp_parcelas_updated before update on emprestimo_parcelas
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. VIEW de resumo por contrato (saldo devedor, totais, próxima parcela, atraso)
--    Status da parcela é derivado aqui (e no client) a partir de hoje.
-- -----------------------------------------------------------------------------
create or replace view emprestimos_resumo as
select
  e.*,
  count(p.id)::int                                              as qtd_parcelas,
  count(p.id) filter (where p.valor_pago >= p.valor_total
                        and p.valor_total > 0)::int             as qtd_pagas,
  coalesce(sum(p.valor_total), 0)::numeric(14,2)                as total_contratado,
  coalesce(sum(p.valor_pago), 0)::numeric(14,2)                 as total_pago,
  coalesce(sum(p.valor_juros), 0)::numeric(14,2)               as total_juros,
  -- saldo devedor = principal + juros já incorridos (vencidos) − tudo que foi pago
  (e.valor_principal
    + coalesce(sum(p.valor_juros) filter (where p.vencimento <= current_date), 0)
    - coalesce(sum(p.valor_pago), 0))::numeric(14,2)            as saldo_devedor,
  -- valor em atraso = soma do que falta pagar em parcelas vencidas
  coalesce(sum(greatest(p.valor_total - p.valor_pago, 0))
    filter (where p.vencimento < current_date
              and p.valor_pago < p.valor_total), 0)::numeric(14,2) as valor_em_atraso,
  count(p.id) filter (where p.vencimento < current_date
                        and p.valor_pago < p.valor_total)::int  as qtd_atrasadas,
  min(p.vencimento) filter (where p.valor_pago < p.valor_total) as proxima_parcela
from emprestimos e
left join emprestimo_parcelas p on p.emprestimo_id = e.id
group by e.id;

-- -----------------------------------------------------------------------------
-- 5. RLS + grants (Supabase religa RLS em tabelas novas; abrimos com policy
--    permissiva, como em 0002/0004).
-- -----------------------------------------------------------------------------
alter table emprestimos           enable row level security;
alter table emprestimo_parcelas   enable row level security;
alter table emprestimo_documentos enable row level security;

drop policy if exists emprestimos_anon_all on emprestimos;
create policy emprestimos_anon_all on emprestimos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists emp_parcelas_anon_all on emprestimo_parcelas;
create policy emp_parcelas_anon_all on emprestimo_parcelas
  for all to anon, authenticated using (true) with check (true);

drop policy if exists emp_docs_anon_all on emprestimo_documentos;
create policy emp_docs_anon_all on emprestimo_documentos
  for all to anon, authenticated using (true) with check (true);

grant all    on emprestimos           to anon, authenticated, service_role;
grant all    on emprestimo_parcelas   to anon, authenticated, service_role;
grant all    on emprestimo_documentos to anon, authenticated, service_role;
grant select on emprestimos_resumo    to anon, authenticated, service_role;
