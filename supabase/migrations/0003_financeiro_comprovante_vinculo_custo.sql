-- =============================================================================
-- 0003 — Gasto financeiro: vínculo ao Custo Real + comprovante (foto)
-- Cada lançamento do financeiro pode ser associado a um item da planilha de
-- Custo Real (para saber NO QUE e ONDE se gastou) e receber a foto de um
-- comprovante. A imagem fica no bucket de Storage "comprovantes"; a linha do
-- financeiro guarda a URL/caminho do arquivo.
-- =============================================================================

-- 1. Colunas no financeiro -----------------------------------------------------
alter table financeiro
  add column if not exists planilha_item_id uuid references planilha_itens(id) on delete set null;
alter table financeiro
  add column if not exists comprovante_url  text;
alter table financeiro
  add column if not exists comprovante_path text;

create index if not exists ix_financeiro_planilha_item on financeiro (planilha_item_id);

-- 2. Bucket de comprovantes ----------------------------------------------------
-- Público (como o bucket "acervo"), servido via getPublicUrl. Os caminhos têm
-- prefixo por obra + nome aleatório, então não são adivinháveis.
insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;

-- 3. Políticas de acesso ao bucket --------------------------------------------
-- Mesmo padrão permissivo do resto do sistema (anon + authenticated). Se a
-- criação de policy em storage.objects falhar por permissão, crie-a pela UI
-- de Storage > Policies do painel do Supabase com as mesmas regras.
drop policy if exists comprovantes_anon_all on storage.objects;
create policy comprovantes_anon_all on storage.objects
  for all to anon, authenticated
  using (bucket_id = 'comprovantes')
  with check (bucket_id = 'comprovantes');
