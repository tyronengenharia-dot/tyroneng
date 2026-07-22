-- =============================================================================
-- 0015 — Lista de Compras da obra (quantitativo de insumos por cronograma)
--
-- A "Lista de Compras" explode cada serviço do Custo Real nos seus insumos
-- (material / mão de obra / equipamento) via servico_insumos:
--     qtd do insumo = qtd do serviço × coeficiente.
-- As visões "Por serviço" e "Consolidada" já saem só do que existe hoje
-- (planilha_itens.servico_id → servico_insumos → insumos). Esta migração
-- adiciona o que falta para a visão "Por cronograma":
--
--   1. planilha_itens.etapa_id  → liga cada serviço a uma etapa do Planejamento.
--      A data de compra vem do início da etapa (etapas.data_inicio).
--   2. obras.compra_lead_dias   → antecedência de compra (comprar N dias antes
--      do início do serviço). "Comprar até" = data_inicio − compra_lead_dias.
--
-- Idempotente (ADD COLUMN IF NOT EXISTS): seguro reaplicar.
-- Aplicar no Supabase DESTE projeto (SQL Editor ou `supabase db push`).
-- NÃO usar o conector MCP de outro projeto.
-- =============================================================================

-- 1. Vínculo item → etapa do cronograma. ON DELETE SET NULL: apagar a etapa não
--    apaga o item; ele apenas volta para "sem etapa" na lista de compras.
alter table planilha_itens
  add column if not exists etapa_id uuid references etapas(id) on delete set null;

comment on column planilha_itens.etapa_id is
  'Etapa do cronograma (Planejamento) a que este serviço pertence. A lista de '
  'compras usa etapas.data_inicio para saber quando comprar. NULL = sem etapa.';

create index if not exists ix_pitem_etapa on planilha_itens (etapa_id);

-- 2. Antecedência de compra por obra (em dias). 0 = comprar até o início do
--    serviço, sem folga.
alter table obras
  add column if not exists compra_lead_dias int not null default 0
    check (compra_lead_dias >= 0);

comment on column obras.compra_lead_dias is
  'Antecedência de compra em dias (lead time). Comprar até = '
  'etapa.data_inicio − compra_lead_dias. Usado pela Lista de Compras.';
