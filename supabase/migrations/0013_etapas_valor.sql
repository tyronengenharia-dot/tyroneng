-- =============================================================================
-- 0013 — Valor (peso financeiro) por etapa do cronograma
-- Cada etapa do Planejamento passa a ter um VALOR PREVISTO em R$ (o quanto
-- aquela etapa representa do contrato). Com isso o cronograma deixa de ser só
-- físico e vira físico-FINANCEIRO: o realizado da etapa é derivado
--   valor_realizado = valor * percentual_financeiro / 100
-- e o total previsto/realizado da obra sai da soma das etapas.
--
-- Idempotente (ADD COLUMN IF NOT EXISTS): seguro reaplicar.
-- Aplicar no Supabase DESTE projeto (SQL Editor ou `supabase db push`).
-- NÃO usar o conector MCP de outro projeto.
-- =============================================================================

alter table etapas
  add column if not exists valor numeric(14,2) not null default 0 check (valor >= 0);

comment on column etapas.valor is
  'Valor previsto (peso financeiro) da etapa em R$. Realizado = valor * percentual_financeiro/100.';
