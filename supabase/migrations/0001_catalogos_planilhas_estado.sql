-- =============================================================================
-- 0001 — Catálogos, Planilhas e Máquina de Estados
-- Sistema de gestão orçamentária de obras (TyronGestão)
--
-- Aplicar no Supabase DESTE projeto (SQL Editor ou `supabase db push`).
-- NÃO usar o conector MCP de outro projeto.
--
-- Convenções (seguindo o banco atual): id uuid default gen_random_uuid(),
-- created_at timestamptz default now(), snake_case, FK para obras(id).
--
-- Mapa das regras de negócio -> onde são impostas neste schema:
--   Regra 1 (Custo Real nasce travado; aprovar Custo Planejado troca o cadeado)
--           -> planilhas.status + planilha_editavel() + aprovar_custo_planejado()
--   Regra 2 (Aditivo só após Venda fechada; múltiplos por obra)
--           -> criar_aditivo() + índices únicos parciais
--   Regra 3 (Serviço só é composto por Insumos)
--           -> servico_insumos.insumo_id FK NOT NULL
--   Regra 4 (Planilhas operacionais sem digitação livre: só Serviço/SINAPI/EMOP)
--           -> planilha_itens.origem + (servico_id | referencia_item_id) + CHECK
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Helper: touch updated_at
-- -----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. CATÁLOGOS GLOBAIS DA EMPRESA (não pertencem a uma obra)
-- -----------------------------------------------------------------------------

-- 2.1 Insumos — material / mão de obra / equipamento. Código único.
--     Abastecido pelo setor de compras (valor unitário de referência).
--     OBS: é o catálogo de ORÇAMENTO, distinto de `materiais` (estoque físico).
create table if not exists insumos (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique,
  tipo           text not null check (tipo in ('material','mao_de_obra','equipamento')),
  descricao      text not null,
  unidade        text not null,
  valor_unitario numeric(14,4) not null default 0 check (valor_unitario >= 0),
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2.2 Serviços — composições. Código único. Preço NÃO é digitado: é derivado
--     dos insumos que o compõem (ver view servicos_custo).
create table if not exists servicos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,
  descricao   text not null,
  unidade     text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2.3 Composição do serviço (Regra 3): cada linha é um insumo + seu consumo.
--     insumo_id NOT NULL => impossível compor serviço com algo fora do catálogo.
create table if not exists servico_insumos (
  id          uuid primary key default gen_random_uuid(),
  servico_id  uuid not null references servicos(id) on delete cascade,
  insumo_id   uuid not null references insumos(id)  on delete restrict,
  coeficiente numeric(18,6) not null check (coeficiente > 0),
  created_at  timestamptz not null default now(),
  unique (servico_id, insumo_id)
);

-- Custo unitário corrente do serviço = Σ (coeficiente × valor_unitario do insumo).
create or replace view servicos_custo as
  select s.id   as servico_id,
         s.codigo,
         s.descricao,
         s.unidade,
         coalesce(sum(si.coeficiente * i.valor_unitario), 0)::numeric(14,4) as custo_unitario
  from servicos s
  left join servico_insumos si on si.servico_id = s.id
  left join insumos i          on i.id = si.insumo_id
  group by s.id;

-- -----------------------------------------------------------------------------
-- 3. REFERÊNCIA EXTERNA — EMOP + SINAPI (global, versionada por mês/ano)
--    Estrutura unificada: as duas fontes têm o mesmo formato útil
--    (código / descrição / unidade / preço por versão). Distinção por `fonte`.
--    A UI pode mostrar duas "páginas" filtrando por fonte.
-- -----------------------------------------------------------------------------
create table if not exists referencia_versoes (
  id           uuid primary key default gen_random_uuid(),
  fonte        text not null check (fonte in ('emop','sinapi')),
  ano          int  not null,
  mes          int  not null check (mes between 1 and 12),
  uf           text,                       -- SINAPI é por UF; EMOP costuma ser RJ
  rotulo       text,                       -- ex.: 'desonerado', 'nao_desonerado'
  importado_em timestamptz not null default now()
);

-- Uma única versão por (fonte, ano, mês, uf, rótulo).
create unique index if not exists uq_referencia_versao
  on referencia_versoes (fonte, ano, mes, coalesce(uf,''), coalesce(rotulo,''));

create table if not exists referencia_itens (
  id             uuid primary key default gen_random_uuid(),
  versao_id      uuid not null references referencia_versoes(id) on delete cascade,
  codigo         text not null,
  descricao      text not null,
  unidade        text not null,
  valor_unitario numeric(14,4) not null default 0,
  created_at     timestamptz not null default now(),
  unique (versao_id, codigo)
);

-- -----------------------------------------------------------------------------
-- 4. PLANILHAS (cabeçalho por obra) + ESTADO
--    Uma linha = uma instância de planilha (Venda / Custo Plan / Custo Real /
--    Aditivo N). É AQUI que vive o cadeado (status).
--
--    Semântica de `status` por tipo (ver planilha_editavel):
--      venda            : rascunho -> fechada
--      custo_planejado  : rascunho -> aprovada            (trava ao aprovar)
--      custo_real       : bloqueada -> liberada           (nasce bloqueada)
--      aditivo          : rascunho -> fechada
-- -----------------------------------------------------------------------------
create table if not exists planilhas (
  id             uuid primary key default gen_random_uuid(),
  obra_id        uuid not null references obras(id) on delete cascade,
  tipo           text not null check (tipo in ('venda','custo_planejado','custo_real','aditivo')),
  aditivo_numero int,
  status         text not null default 'rascunho'
                 check (status in ('rascunho','aprovada','fechada','bloqueada','liberada')),
  aprovado_em    timestamptz,
  aprovado_por   uuid,
  fechado_em     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- aditivo_numero obrigatório só para aditivos; nulo para os demais
  check (
    (tipo = 'aditivo'  and aditivo_numero is not null) or
    (tipo <> 'aditivo' and aditivo_numero is null)
  )
);

-- Venda / Custo Plan / Custo Real: no máximo UMA por obra.
create unique index if not exists uq_planilha_unica
  on planilhas (obra_id, tipo) where tipo <> 'aditivo';

-- Aditivos: numeração única por obra (Aditivo 1, 2, 3...).
create unique index if not exists uq_planilha_aditivo
  on planilhas (obra_id, aditivo_numero) where tipo = 'aditivo';

create trigger trg_planilhas_updated before update on planilhas
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. EVOLUÇÃO das tabelas operacionais já existentes
--    (planilha_categorias / planilha_itens) — vincula ao cabeçalho e impõe a
--    Regra 4 (origem obrigatória + snapshot de preço).
-- -----------------------------------------------------------------------------

-- 5.1 Categorias: aponta para o cabeçalho.
alter table planilha_categorias
  add column if not exists planilha_id uuid references planilhas(id) on delete cascade;

-- 5.2 Itens: cabeçalho + origem + vínculo + snapshot.
alter table planilha_itens
  add column if not exists planilha_id        uuid references planilhas(id) on delete cascade,
  add column if not exists origem             text,
  add column if not exists servico_id         uuid references servicos(id)         on delete restrict,
  add column if not exists referencia_item_id uuid references referencia_itens(id) on delete restrict;

-- Regra 4: todo item nasce de um Serviço OU de um item de referência (SINAPI/EMOP).
-- (Tolerante a `origem IS NULL` por causa de linhas de protótipo; a etapa 11
--  mostra como tornar estrito depois de limpar os dados legados.)
alter table planilha_itens drop constraint if exists chk_planilha_item_origem;
alter table planilha_itens add constraint chk_planilha_item_origem check (
  origem is null
  or (origem = 'servico'           and servico_id is not null         and referencia_item_id is null)
  or (origem in ('sinapi','emop')  and referencia_item_id is not null and servico_id is null)
);

-- -----------------------------------------------------------------------------
-- 6. MEMÓRIA DE CÁLCULO (por obra) — justifica o quantitativo de cada item.
-- -----------------------------------------------------------------------------
create table if not exists memoria_calculo (
  id               uuid primary key default gen_random_uuid(),
  obra_id          uuid not null references obras(id) on delete cascade,
  planilha_item_id uuid references planilha_itens(id) on delete cascade,
  descricao        text not null,                 -- ex.: 'Área do pavimento tipo'
  formula          text,                          -- ex.: '12.5 * 8.0 * 3'
  quantidade       numeric(18,6) not null default 0,
  unidade          text,
  ordem            int not null default 0,
  created_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. Editabilidade derivada do (tipo, status)
-- -----------------------------------------------------------------------------
create or replace function planilha_editavel(p_tipo text, p_status text)
returns boolean language sql immutable as $$
  select case p_tipo
    when 'venda'           then p_status = 'rascunho'
    when 'custo_planejado' then p_status = 'rascunho'
    when 'custo_real'      then p_status = 'liberada'
    when 'aditivo'         then p_status = 'rascunho'
    else false
  end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Seed automático + backfill  (ANTES de criar a trava da etapa 9,
--    para que o backfill não seja bloqueado por ele)
-- -----------------------------------------------------------------------------

-- Toda nova obra nasce com as 3 planilhas; Custo Real já bloqueada (Regra 1).
create or replace function tg_seed_planilhas_obra() returns trigger
language plpgsql as $$
begin
  insert into planilhas (obra_id, tipo, status) values
    (new.id, 'venda',           'rascunho'),
    (new.id, 'custo_planejado', 'rascunho'),
    (new.id, 'custo_real',      'bloqueada');
  return new;
end;
$$;

drop trigger if exists trg_seed_planilhas on obras;
create trigger trg_seed_planilhas after insert on obras
  for each row execute function tg_seed_planilhas_obra();

-- Backfill das obras já existentes.
insert into planilhas (obra_id, tipo, status)
select o.id, t.tipo,
       case t.tipo when 'custo_real' then 'bloqueada' else 'rascunho' end
from obras o
cross join (values ('venda'),('custo_planejado'),('custo_real')) as t(tipo)
where not exists (
  select 1 from planilhas p where p.obra_id = o.id and p.tipo = t.tipo
);

-- Defensivo: garante cabeçalho p/ qualquer (obra_id,tipo) já presente nas
-- tabelas operacionais atuais (caso haja dados fora do conjunto canônico).
insert into planilhas (obra_id, tipo, status)
select distinct src.obra_id, src.tipo,
       case src.tipo when 'custo_real' then 'bloqueada' else 'rascunho' end
from (
  select obra_id, tipo from planilha_categorias
  union
  select obra_id, tipo from planilha_itens
) src
where src.tipo in ('venda','custo_planejado','custo_real')
  and not exists (
    select 1 from planilhas p where p.obra_id = src.obra_id and p.tipo = src.tipo
  );

-- Liga as linhas existentes ao cabeçalho correspondente.
update planilha_categorias c
   set planilha_id = p.id
  from planilhas p
 where p.obra_id = c.obra_id and p.tipo = c.tipo and p.tipo <> 'aditivo'
   and c.planilha_id is null;

update planilha_itens i
   set planilha_id = p.id
  from planilhas p
 where p.obra_id = i.obra_id and p.tipo = i.tipo and p.tipo <> 'aditivo'
   and i.planilha_id is null;

-- Agora o vínculo é obrigatório.
alter table planilha_categorias alter column planilha_id set not null;
alter table planilha_itens      alter column planilha_id set not null;

-- -----------------------------------------------------------------------------
-- 9. TRAVA DE EDIÇÃO (Regra 1) — recusa escrita em planilha bloqueada.
--    Também resolve planilha_id a partir de (obra_id,tipo) quando o app antigo
--    não informa (compatibilidade com o service atual; aditivo exige id).
-- -----------------------------------------------------------------------------
create or replace function tg_planilha_write_guard() returns trigger
language plpgsql as $$
declare
  v_pid    uuid;
  v_tipo   text;
  v_status text;
begin
  if tg_op in ('INSERT','UPDATE') then
    if new.planilha_id is null and new.tipo is not null and new.tipo <> 'aditivo' then
      select id into new.planilha_id
        from planilhas where obra_id = new.obra_id and tipo = new.tipo;
    end if;
    v_pid := new.planilha_id;
  else
    v_pid := old.planilha_id;
  end if;

  if v_pid is null then
    raise exception 'planilha_id ausente e não resolvível (obra %, tipo %)',
      coalesce(new.obra_id, old.obra_id), coalesce(new.tipo, old.tipo);
  end if;

  select tipo, status into v_tipo, v_status from planilhas where id = v_pid;

  if not planilha_editavel(v_tipo, v_status) then
    raise exception 'Planilha bloqueada para edição (tipo %, status %)', v_tipo, v_status
      using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_guard_itens on planilha_itens;
create trigger trg_guard_itens
  before insert or update or delete on planilha_itens
  for each row execute function tg_planilha_write_guard();

drop trigger if exists trg_guard_categorias on planilha_categorias;
create trigger trg_guard_categorias
  before insert or update or delete on planilha_categorias
  for each row execute function tg_planilha_write_guard();

-- -----------------------------------------------------------------------------
-- 10. TRANSIÇÕES DE ESTADO (RPC) — cada função é uma transação atômica.
-- -----------------------------------------------------------------------------

-- Fecha a Venda (Regra 2: habilita criação de aditivos).
create or replace function fechar_venda(p_obra_id uuid) returns void
language plpgsql security definer as $$
begin
  update planilhas
     set status = 'fechada', fechado_em = now()
   where obra_id = p_obra_id and tipo = 'venda' and status = 'rascunho';
  if not found then
    raise exception 'Venda inexistente ou já fechada para a obra %', p_obra_id;
  end if;
end;
$$;

-- Aprova o Custo Planejado: trava ele e libera o Custo Real (Regra 1) — atômico.
create or replace function aprovar_custo_planejado(p_obra_id uuid, p_aprovado_por uuid default null)
returns void language plpgsql security definer as $$
begin
  update planilhas
     set status = 'aprovada', aprovado_em = now(), aprovado_por = p_aprovado_por
   where obra_id = p_obra_id and tipo = 'custo_planejado' and status = 'rascunho';
  if not found then
    raise exception 'Custo Planejado inexistente ou não está em rascunho (obra %)', p_obra_id;
  end if;

  update planilhas
     set status = 'liberada'
   where obra_id = p_obra_id and tipo = 'custo_real';
end;
$$;

-- Cria o próximo Aditivo (Regra 2: só após Venda fechada). Retorna o id.
create or replace function criar_aditivo(p_obra_id uuid) returns uuid
language plpgsql security definer as $$
declare
  v_venda_status text;
  v_num          int;
  v_id           uuid;
begin
  select status into v_venda_status
    from planilhas where obra_id = p_obra_id and tipo = 'venda';

  if v_venda_status is distinct from 'fechada' then
    raise exception 'Aditivo só pode ser criado após o fechamento da Venda (status: %)',
      coalesce(v_venda_status, 'inexistente');
  end if;

  select coalesce(max(aditivo_numero), 0) + 1 into v_num
    from planilhas where obra_id = p_obra_id and tipo = 'aditivo';

  insert into planilhas (obra_id, tipo, aditivo_numero, status)
       values (p_obra_id, 'aditivo', v_num, 'rascunho')
    returning id into v_id;

  return v_id;
end;
$$;

-- Fecha um Aditivo específico.
create or replace function fechar_aditivo(p_planilha_id uuid) returns void
language plpgsql security definer as $$
begin
  update planilhas
     set status = 'fechada', fechado_em = now()
   where id = p_planilha_id and tipo = 'aditivo' and status = 'rascunho';
  if not found then
    raise exception 'Aditivo inexistente ou já fechado (%)', p_planilha_id;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 11. Índices auxiliares
-- -----------------------------------------------------------------------------
create index if not exists ix_servico_insumos_servico on servico_insumos (servico_id);
create index if not exists ix_servico_insumos_insumo  on servico_insumos (insumo_id);
create index if not exists ix_referencia_itens_versao  on referencia_itens (versao_id);
create index if not exists ix_planilhas_obra           on planilhas (obra_id, tipo);
create index if not exists ix_pcat_planilha            on planilha_categorias (planilha_id);
create index if not exists ix_pitem_planilha           on planilha_itens (planilha_id);
create index if not exists ix_pitem_servico            on planilha_itens (servico_id);
create index if not exists ix_pitem_referencia         on planilha_itens (referencia_item_id);
create index if not exists ix_memoria_item             on memoria_calculo (planilha_item_id);

create trigger trg_insumos_updated before update on insumos
  for each row execute function set_updated_at();
create trigger trg_servicos_updated before update on servicos
  for each row execute function set_updated_at();

-- =============================================================================
-- ETAPA 11 (OPCIONAL / FUTURA) — tornar a Regra 4 ESTRITA
-- Rodar só depois de migrar/limpar as linhas de protótipo (origem IS NULL):
--
--   -- conferir o que ainda está sem origem:
--   -- select count(*) from planilha_itens where origem is null;
--
--   alter table planilha_itens alter column origem set not null;
--   alter table planilha_itens drop constraint chk_planilha_item_origem;
--   alter table planilha_itens add constraint chk_planilha_item_origem check (
--     (origem = 'servico'          and servico_id is not null         and referencia_item_id is null) or
--     (origem in ('sinapi','emop') and referencia_item_id is not null and servico_id is null)
--   );
--
-- RLS: mantida como está hoje (acesso via anon key). As travas acima são
-- triggers, então valem independentemente de RLS. Quando houver RLS por
-- usuário, as RPCs (security definer) continuam funcionando.
-- =============================================================================
