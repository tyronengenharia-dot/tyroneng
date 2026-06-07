-- =============================================================================
-- 0005 — Reabrir Custo Planejado (destravar após a aprovação)
--
-- Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) — SQL Editor ou
-- `supabase db push`. NÃO usar o conector MCP de outro projeto.
-- Depende de 0001 (tabela `planilhas`, write-guard, `planilha_editavel`).
--
-- Regra de negócio (pedido do usuário):
--   Aprovar o Custo Planejado o trava e libera o Custo Real (ver 0001). Às vezes
--   é preciso voltar e corrigir o Custo Planejado. Isso passa a ser permitido,
--   mas o Custo Real torna-se inválido (a linha de base mudou):
--     • Custo Real ainda NÃO preenchido  -> reabre direto.
--     • Custo Real JÁ tem itens          -> exige confirmação explícita
--       (p_apagar_custo_real = true) e APAGA todo o Custo Real.
--   A dupla confirmação contra clique acidental é feita na interface.
--
-- FKs que apontam para planilha_itens são seguras na exclusão:
--   financeiro.planilha_item_id  -> ON DELETE SET NULL (desvincula o gasto)
--   medicao_itens.planilha_item_id -> ON DELETE CASCADE (mede a Venda, não o Custo Real)
-- =============================================================================

create or replace function reabrir_custo_planejado(
  p_obra_id           uuid,
  p_apagar_custo_real boolean default false
) returns void
language plpgsql security definer as $$
declare
  v_plan_id  uuid;
  v_real_id  uuid;
  v_real_qtd int;
begin
  -- O Custo Planejado precisa estar aprovado (senão não há o que reabrir).
  select id into v_plan_id
    from planilhas
   where obra_id = p_obra_id and tipo = 'custo_planejado' and status = 'aprovada';
  if not found then
    raise exception 'Custo Planejado não está aprovado — nada a reabrir (obra %)', p_obra_id;
  end if;

  select id into v_real_id
    from planilhas
   where obra_id = p_obra_id and tipo = 'custo_real';

  select count(*) into v_real_qtd
    from planilha_itens
   where obra_id = p_obra_id and tipo = 'custo_real';

  -- Trava de segurança: havendo dados no Custo Real, a exclusão precisa ser
  -- confirmada. A interface só envia p_apagar_custo_real = true após a dupla
  -- confirmação do usuário.
  if v_real_qtd > 0 and not p_apagar_custo_real then
    raise exception
      'O Custo Real possui % item(ns) que serão apagados. Confirme a exclusão para reabrir.', v_real_qtd
      using errcode = 'check_violation';
  end if;

  -- Apaga o Custo Real ENQUANTO ainda está 'liberada' (o write-guard só permite
  -- a exclusão nesse estado). Itens antes das categorias por causa da FK.
  if v_real_id is not null then
    delete from planilha_itens
     where obra_id = p_obra_id and tipo = 'custo_real';
    delete from planilha_categorias
     where obra_id = p_obra_id and tipo = 'custo_real';
    update planilhas set status = 'bloqueada' where id = v_real_id;
  end if;

  -- Reabre o Custo Planejado para edição (limpa os campos de aprovação).
  update planilhas
     set status = 'rascunho', aprovado_em = null, aprovado_por = null
   where id = v_plan_id;
end;
$$;
