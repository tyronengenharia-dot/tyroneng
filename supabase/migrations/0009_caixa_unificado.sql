-- =============================================================================
-- 0009 — CAIXA UNIFICADO
-- Unifica Bancos + Financeiro + Empréstimos + Financeiro de obra num único
-- livro-caixa reconciliado POR CONSTRUÇÃO (nada "voando", sem digitação dupla):
--   * Toda movimentação realizada nasce na ORIGEM (parcela do Custo Real,
--     Medição, parcela/desembolso de Empréstimo, ou lançamento geral) e carrega
--     uma CONTA bancária (conta_id) + comprovante.
--   * A view `movimentacoes_consolidadas` une todas as origens num só fluxo.
--   * `bancos_contas_saldo` passa a DERIVAR o saldo da view consolidada — o saldo
--     do banco nunca é digitado, é somatório das movimentações que apontam pra ele.
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) via SQL Editor
-- ou `supabase db push`. NÃO usar o conector MCP de outro projeto. Idempotente.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. conta_id nas ORIGENS (de qual central de conta o dinheiro saiu/entrou)
--    on delete set null: apagar a conta não apaga o histórico da origem.
-- -----------------------------------------------------------------------------
alter table custo_real_pagamentos
  add column if not exists conta_id uuid references bancos_contas(id) on delete set null;

alter table emprestimo_parcelas
  add column if not exists conta_id uuid references bancos_contas(id) on delete set null;

alter table emprestimo_rateios
  add column if not exists conta_id uuid references bancos_contas(id) on delete set null;

-- -----------------------------------------------------------------------------
-- 2. Medição (entradas) — hoje não tem conta/comprovante/forma; passa a ter,
--    pois "medição paga = receita realizada" precisa tocar uma conta + comprovar.
--    data_pagamento = quando o recebimento caiu (fallback: data_medicao).
-- -----------------------------------------------------------------------------
alter table medicao_boletins
  add column if not exists conta_id         uuid references bancos_contas(id) on delete set null;
alter table medicao_boletins
  add column if not exists comprovante_url  text;
alter table medicao_boletins
  add column if not exists comprovante_path text;
alter table medicao_boletins
  add column if not exists forma_pagamento  text;
alter table medicao_boletins
  add column if not exists data_pagamento   date;

create index if not exists ix_crpag_conta     on custo_real_pagamentos (conta_id);
create index if not exists ix_emp_parc_conta  on emprestimo_parcelas (conta_id);
create index if not exists ix_emp_rat_conta   on emprestimo_rateios (conta_id);
create index if not exists ix_med_bol_conta   on medicao_boletins (conta_id);

-- -----------------------------------------------------------------------------
-- 3. VIEW consolidada — o fluxo de caixa único da empresa.
--    Cada linha é uma movimentação, vinda de sua origem real (sem cópia/posting).
--    `realizado` normaliza os vários status das origens:
--      geral  : pago/conciliado          medição : status = 'pago'
--      custo  : status = 'pago'           parcela : valor_pago > 0
--      rateio : status = 'recebido'
--    saldo do banco = só `realizado` com conta_id; previsto = todos.
--    bancos_contas_saldo depende desta view, então dropamos ela primeiro.
-- -----------------------------------------------------------------------------
drop view if exists bancos_contas_saldo;
drop view if exists movimentacoes_consolidadas;

create view movimentacoes_consolidadas as
-- 3.1 Lançamentos GERAIS (não-obra) + transferências — tabela bancos_movimentacoes.
--     É o único fluxo digitado à mão, feito na página Financeiro.
select
  'mov-' || m.id::text                     as id,
  'geral'::text                            as origem,
  m.id                                     as origem_id,
  m.data                                   as data,
  m.tipo                                   as tipo,
  m.valor                                  as valor,
  (m.status in ('pago','conciliado'))      as realizado,
  m.conta_id                               as conta_id,
  m.obra_id                                as obra_id,
  m.categoria_id                           as categoria_id,
  m.descricao                              as descricao,
  m.anexo_url                              as comprovante_url,
  m.forma_pagamento                        as forma_pagamento,
  m.beneficiario                           as beneficiario,
  m.transferencia_id                       as transferencia_id
from bancos_movimentacoes m

union all
-- 3.2 SAÍDAS de obra — parcelas do Custo Real.
select
  'crp-' || p.id::text,
  'custo_real',
  p.id,
  p.data,
  'saida',
  p.valor,
  (p.status = 'pago'),
  p.conta_id,
  p.obra_id,
  null::uuid,
  coalesce(nullif(trim(p.descricao), ''), 'Custo Real'),
  p.comprovante_url,
  null::text,
  null::text,
  null::uuid
from custo_real_pagamentos p

union all
-- 3.3 ENTRADAS de obra — Medições (rascunho ignorado; valor = Σ dos itens).
select
  'med-' || b.id::text,
  'medicao',
  b.id,
  coalesce(b.data_pagamento, b.data_medicao),
  'entrada',
  coalesce(t.total, 0),
  (b.status = 'pago'),
  b.conta_id,
  b.obra_id,
  null::uuid,
  'Medição — Boletim Nº ' || b.numero::text,
  b.comprovante_url,
  b.forma_pagamento,
  null::text,
  null::uuid
from medicao_boletins b
left join (
  select boletim_id, sum(quantidade * valor_unitario) as total
  from medicao_itens
  group by boletim_id
) t on t.boletim_id = b.id
where b.status <> 'rascunho'

union all
-- 3.4 SAÍDAS — pagamento de parcela de Empréstimo (dinheiro indo ao credor).
select
  'epar-' || pa.id::text,
  'emprestimo_parcela',
  pa.id,
  pa.data_pagamento,
  'saida',
  pa.valor_pago,
  true,
  pa.conta_id,
  null::uuid,
  null::uuid,
  'Empréstimo — Parcela ' || pa.numero::text,
  pa.comprovante_url,
  pa.forma_pagamento,
  null::text,
  null::uuid
from emprestimo_parcelas pa
where coalesce(pa.valor_pago, 0) > 0 and pa.data_pagamento is not null

union all
-- 3.5 ENTRADAS — desembolso de empréstimo rateado (dinheiro entrando na conta).
select
  'erat-' || r.id::text,
  'emprestimo_rateio',
  r.id,
  r.data,
  'entrada',
  r.valor,
  (r.status = 'recebido'),
  r.conta_id,
  r.obra_id,
  null::uuid,
  coalesce(nullif(trim(r.descricao), ''), 'Empréstimo (desembolso)'),
  r.comprovante_url,
  null::text,
  null::text,
  null::uuid
from emprestimo_rateios r;

-- -----------------------------------------------------------------------------
-- 4. bancos_contas_saldo — saldo DERIVADO da view consolidada.
--    Mesmas colunas de saída da versão da 0004 (o app não muda o tipo).
-- -----------------------------------------------------------------------------
create view bancos_contas_saldo as
select
  c.id, c.nome, c.tipo, c.banco, c.agencia, c.numero_conta, c.titular,
  c.saldo_inicial, c.cor, c.ativo, c.observacoes, c.created_at, c.updated_at,
  (c.saldo_inicial + coalesce(sum(
    case when mc.realizado
         then case when mc.tipo = 'entrada' then mc.valor else -mc.valor end
         else 0 end), 0))::numeric(14,2) as saldo_atual,
  (c.saldo_inicial + coalesce(sum(
    case when mc.tipo = 'entrada' then mc.valor else -mc.valor end), 0))::numeric(14,2) as saldo_previsto,
  coalesce(sum(case when not mc.realizado then 1 else 0 end), 0)::int as qtd_previstos,
  coalesce(sum(case when mc.realizado     then 1 else 0 end), 0)::int as qtd_realizados
from bancos_contas c
left join movimentacoes_consolidadas mc on mc.conta_id = c.id
group by c.id;

-- -----------------------------------------------------------------------------
-- 5. Grants (views herdam RLS das tabelas-base; só liberamos SELECT).
-- -----------------------------------------------------------------------------
grant select on movimentacoes_consolidadas to anon, authenticated, service_role;
grant select on bancos_contas_saldo        to anon, authenticated, service_role;
