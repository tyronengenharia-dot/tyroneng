-- =============================================================================
-- 0010 — Migra o legado da página Financeiro para o livro de lançamentos gerais
-- A página Financeiro global usava a tabela `financial_records` (um silo solto,
-- sem conta nem obra). No caixa unificado, os lançamentos NÃO ligados a obra
-- moram em `bancos_movimentacoes` (lançamentos gerais + transferências), e a
-- página Financeiro passa a lê-los pela view `movimentacoes_consolidadas`.
--
-- Esta migration copia `financial_records` -> `bancos_movimentacoes`, best-effort:
--   * só roda se a tabela existir (to_regclass) e só uma vez (marcador no texto);
--   * conta_id fica NULL (o legado não sabia de qual conta saiu) — esses lançamentos
--     aparecem no histórico mas não afetam o saldo de nenhuma conta específica;
--   * status 'cancelado' é ignorado; 'pago' -> pago; o resto -> previsto.
--
-- NÃO importo a tabela `financeiro` (legado por-obra): o dinheiro de obra agora
-- vem de custo_real_pagamentos + medicao_boletins, então importá-la causaria
-- DUPLA CONTAGEM. Ela fica dormente (nenhuma tela lê mais dela).
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr). NÃO via MCP.
-- =============================================================================

do $$
begin
  if to_regclass('public.financial_records') is null then
    raise notice 'financial_records não existe — nada a migrar.';
    return;
  end if;

  if exists (
    select 1 from bancos_movimentacoes
    where observacoes like '%[import:financial_records]%'
  ) then
    raise notice 'financial_records já foi importado anteriormente — pulando.';
    return;
  end if;

  insert into bancos_movimentacoes
    (tipo, data, valor, descricao, beneficiario, documento, status, anexo_url, observacoes)
  select
    fr.type,
    coalesce(fr.date, current_date),
    fr.value,
    coalesce(nullif(trim(fr.description), ''), 'Lançamento importado'),
    fr.supplier_name,
    fr.doc_number,
    case when fr.status = 'pago' then 'pago' else 'previsto' end,
    fr.receipt_url,
    '[import:financial_records] ' || coalesce(fr.notes, '')
  from financial_records fr
  where coalesce(fr.status, '') <> 'cancelado'
    and fr.type in ('entrada', 'saida')
    and fr.value is not null
    and fr.value > 0;

  raise notice 'financial_records importado para bancos_movimentacoes.';
end $$;
