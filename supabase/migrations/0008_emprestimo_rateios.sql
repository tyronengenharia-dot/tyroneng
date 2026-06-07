-- =============================================================================
-- 0008 — Rateio de empréstimos entre obras (destinos)
-- Um empréstimo é GLOBAL: o valor principal pode ser rateado entre vários
-- destinos — cada destino é uma OBRA (obra_id) ou "outros/uso geral" (obra_id
-- NULL). A fatia alocada a uma obra entra como ENTRADA no Financeiro dessa obra
-- (status 'recebido' = realizado; 'previsto' = a receber).
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) via SQL Editor
-- ou `supabase db push`. NÃO usar o conector MCP de outro projeto. Idempotente.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists emprestimo_rateios (
  id               uuid primary key default gen_random_uuid(),
  emprestimo_id    uuid not null references emprestimos(id) on delete cascade,
  -- Destino: uma obra OU "outros/uso geral" quando NULL (um empréstimo pode ter
  -- ido para vários lugares, não necessariamente uma obra só).
  obra_id          uuid references obras(id) on delete set null,
  descricao        text,                         -- ex.: "Compra de material", "Capital de giro"
  valor            numeric(14,2) not null default 0 check (valor >= 0),
  data             date,                          -- quando o recurso foi destinado
  status           text not null default 'recebido'
                     check (status in ('recebido','previsto')),
  comprovante_url  text,
  comprovante_path text,
  created_at       timestamptz not null default now()
);

create index if not exists ix_emp_rateios_emprestimo on emprestimo_rateios (emprestimo_id);
create index if not exists ix_emp_rateios_obra        on emprestimo_rateios (obra_id);

-- RLS permissiva (mesmo padrão de 0004/0006).
alter table emprestimo_rateios enable row level security;
drop policy if exists emp_rateios_anon_all on emprestimo_rateios;
create policy emp_rateios_anon_all on emprestimo_rateios
  for all to anon, authenticated using (true) with check (true);
grant all on emprestimo_rateios to anon, authenticated, service_role;

-- Bucket de comprovantes (idempotente; já criado em 0006/0007).
insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;
