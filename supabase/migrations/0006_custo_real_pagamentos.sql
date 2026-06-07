-- =============================================================================
-- 0006 — Pagamentos (parcelas) dos itens de Custo Real
-- O gasto da obra é registrado UMA vez, aqui: cada item da planilha de Custo
-- Real (quantidade real × valor real) pode ter N pagamentos/parcelas, cada um
-- com valor, data, status e comprovante. A aba Financeiro passa a ser apenas
-- uma LEITURA/resumo: as SAÍDAS vêm destas parcelas (pago = realizado;
-- pendente/atrasado = comprometido) e as ENTRADAS vêm das Medições.
--
-- Aplicar no Supabase DESTE projeto (SQL Editor ou `supabase db push`).
-- NÃO usar o conector MCP de outro projeto.
-- Convenções: id uuid default gen_random_uuid(), created_at default now(),
-- snake_case, RLS ligado + policy permissiva (o app usa a anon key).
-- =============================================================================

create extension if not exists pgcrypto;

-- 1. Tabela --------------------------------------------------------------------
create table if not exists custo_real_pagamentos (
  id               uuid primary key default gen_random_uuid(),
  -- Item de Custo Real ao qual a parcela pertence (saída "presa" — Regra: toda
  -- saída do Financeiro nasce de um item do Custo Real, nunca solta).
  planilha_item_id uuid not null references planilha_itens(id) on delete cascade,
  -- Denormalizado: facilita o resumo do Financeiro por obra sem join.
  obra_id          uuid not null references obras(id) on delete cascade,
  descricao        text,                       -- ex.: "Parcela 1/3", "Entrada", NF 123
  valor            numeric(14,2) not null default 0 check (valor >= 0),
  data             date,                        -- data do pagamento / vencimento
  status           text not null default 'pendente'
                     check (status in ('pago','pendente','atrasado')),
  comprovante_url  text,                        -- foto no bucket "comprovantes"
  comprovante_path text,
  created_at       timestamptz not null default now()
);

create index if not exists ix_crpag_item on custo_real_pagamentos (planilha_item_id);
create index if not exists ix_crpag_obra on custo_real_pagamentos (obra_id);

-- 2. RLS (mesmo padrão permissivo das migrations 0002/0004) --------------------
alter table custo_real_pagamentos enable row level security;
drop policy if exists custo_real_pagamentos_anon_all on custo_real_pagamentos;
create policy custo_real_pagamentos_anon_all on custo_real_pagamentos
  for all to anon, authenticated
  using (true) with check (true);
grant all on custo_real_pagamentos to anon, authenticated, service_role;

-- 3. Bucket de comprovantes (idempotente; reutiliza o criado na 0003) ----------
insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;

drop policy if exists comprovantes_anon_all on storage.objects;
create policy comprovantes_anon_all on storage.objects
  for all to anon, authenticated
  using (bucket_id = 'comprovantes')
  with check (bucket_id = 'comprovantes');
