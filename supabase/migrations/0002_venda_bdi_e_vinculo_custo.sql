-- =============================================================================
-- 0002 — BDI da Venda + vínculo Venda→Custo
-- O BDI só existe para a planilha de Venda. A Venda é derivada do Custo
-- Planejado (Custo × fator BDI), mas permanece independente e editável:
-- itens vinculados ao custo são re-precificados; itens manuais ficam intactos.
--
-- Fórmula (TCU): fator = (1 + AC + R + SG + DF + P) × (1 + L) / (1 − I)
--   AC=administração  R=risco  SG=seguro/garantia  DF=desp. financeiras
--   P=perdas  L=lucro  I=impostos      BDI% = (fator − 1) × 100
-- =============================================================================

-- Configuração de BDI por obra (componentes; o % é derivado pela fórmula TCU).
create table if not exists venda_bdi (
  obra_id              uuid primary key references obras(id) on delete cascade,
  administracao        numeric(8,4) not null default 0,  -- Administração central
  lucro                numeric(8,4) not null default 0,  -- Lucro
  impostos             numeric(8,4) not null default 0,  -- PIS/COFINS/ISS/CPRB (divisor)
  risco                numeric(8,4) not null default 0,  -- Riscos
  perdas               numeric(8,4) not null default 0,  -- Perdas/desperdício
  seguro_garantia      numeric(8,4) not null default 0,  -- Seguro + Garantia
  despesas_financeiras numeric(8,4) not null default 0,  -- Despesas financeiras
  updated_at           timestamptz not null default now()
);
alter table venda_bdi disable row level security;
grant all on venda_bdi to anon, authenticated, service_role;

drop trigger if exists trg_venda_bdi_updated on venda_bdi;
create trigger trg_venda_bdi_updated before update on venda_bdi
  for each row execute function set_updated_at();

-- Vínculo Venda → Custo: permite recalcular SÓ os itens derivados do custo,
-- preservando itens adicionados/editados manualmente na Venda.
alter table planilha_itens
  add column if not exists origem_custo_item_id uuid references planilha_itens(id) on delete set null;
alter table planilha_categorias
  add column if not exists origem_custo_cat_id uuid references planilha_categorias(id) on delete set null;

create index if not exists ix_pitem_origem_custo on planilha_itens (origem_custo_item_id);
create index if not exists ix_pcat_origem_custo  on planilha_categorias (origem_custo_cat_id);
