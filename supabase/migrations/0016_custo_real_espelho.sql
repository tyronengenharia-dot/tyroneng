-- =============================================================================
-- 0016 — Registro do que já foi espelhado no Custo Real
--
-- O botão "Espelhar plano no Custo Real" (ver custoRealMirrorService) copia os
-- serviços do Custo Planejado para o Custo Real, ligando cada item pela origem
-- (origem_custo_item_id). O problema: se você APAGAR um item no Custo Real e
-- reexecutar o espelhamento, sem memória ele recriaria o item apagado.
--
-- Esta coluna guarda os ids dos itens do Custo Planejado que JÁ foram espelhados
-- (mesmo que o item do Custo Real correspondente tenha sido apagado depois).
-- Assim, reexecutar "Espelhar" só traz serviços realmente novos do plano e
-- RESPEITA o que você apagou de propósito.
--
-- Idempotente. Aplicar no Supabase DESTE projeto (SQL Editor ou `supabase db
-- push`). NÃO usar o conector MCP de outro projeto.
-- =============================================================================

alter table obras
  add column if not exists custo_real_espelho jsonb not null default '[]'::jsonb;

comment on column obras.custo_real_espelho is
  'Ids (uuid) de itens do Custo Planejado já espelhados no Custo Real. Evita que '
  'reexecutar "Espelhar" ressuscite itens apagados de propósito no Custo Real.';
