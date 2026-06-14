-- =============================================================================
-- 0014 — Dados do contrato (na obra) + Configuração da empresa (RT)
-- Persiste na NUVEM tudo o que a capa/assinatura do PDF de cronograma usa,
-- para ficar disponível em qualquer computador/navegador (sem localStorage):
--   • obras.contrato (jsonb) — dados do contrato POR OBRA (capa do PDF)
--   • empresa_config         — identidade da empresa + responsável técnico,
--                              linha única (singleton), igual em todas as obras
--
-- Idempotente. Aplicar no Supabase DESTE projeto (ref zlxsaxevmnscdqmbfkpr) via
-- SQL Editor ou `supabase db push`. NÃO usar o conector MCP de outro projeto.
-- Convenções: RLS ligado + policy permissiva anon/authenticated (o app usa a
-- anon key, igual ao restante do sistema — ver 0002/0004).
-- =============================================================================

create extension if not exists pgcrypto;

-- set_updated_at() já existe (0001/0004); recriada p/ a migration ser auto-suficiente.
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 1. Dados do contrato por obra (capa do cronograma) --------------------------
-- jsonb livre: { numero, objeto, contratante, contratada, local, valor, dataAssinatura }
alter table obras
  add column if not exists contrato jsonb not null default '{}'::jsonb;

-- 2. Configuração da empresa (linha única) ------------------------------------
create table if not exists empresa_config (
  id           uuid primary key default gen_random_uuid(),
  singleton    boolean not null default true unique,  -- garante 1 só linha
  razao_social text,
  cnpj         text,
  rt_nome      text,   -- responsável técnico: nome
  rt_titulo    text,   -- ex.: 'Engenheiro Civil'
  rt_crea      text,   -- ex.: 'SP-123456789'
  logo_url     text,   -- logo da empresa p/ os PDFs (data URL base64, ~256px)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Reaplicável: se a tabela já existia sem a coluna logo_url.
alter table empresa_config add column if not exists logo_url text;

drop trigger if exists trg_empresa_config_updated on empresa_config;
create trigger trg_empresa_config_updated before update on empresa_config
  for each row execute function set_updated_at();

-- 3. RLS + grants -------------------------------------------------------------
alter table empresa_config enable row level security;

drop policy if exists empresa_config_anon_all on empresa_config;
create policy empresa_config_anon_all on empresa_config
  for all to anon, authenticated using (true) with check (true);

grant all on empresa_config to anon, authenticated, service_role;

-- 4. Seed da linha única (idempotente) ----------------------------------------
insert into empresa_config (singleton, razao_social, rt_titulo)
values (true, 'Tyron Engenharia', 'Engenheiro Civil')
on conflict (singleton) do nothing;
