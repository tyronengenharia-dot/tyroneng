-- =============================================================================
-- 0017 — Serviço como componente de outro serviço (composição recursiva)
--
-- Até aqui um serviço era composto SÓ por insumos (Regra 3 da 0001). Agora a
-- composição (servico_insumos) aceita, em cada linha, UM insumo OU UM outro
-- serviço (subserviço) com seu coeficiente. Ex.: "Pintura geral de parede" =
-- 1× Emassamento + 1× Lixamento + 1× Pintura (cada um é um serviço).
--
-- O custo do subserviço entra no pai: custo(pai) = Σ coef×insumo + Σ coef×custo(sub).
-- A view servicos_custo passa a ser RECURSIVA. Ciclos (A contém B contém A) são
-- barrados por trigger na escrita.
--
-- Idempotente. Aplicar no Supabase DESTE projeto (SQL Editor ou `supabase db
-- push`). NÃO usar o conector MCP de outro projeto.
-- =============================================================================

-- 1. Coluna de subserviço + libera insumo_id (uma linha é insumo XOR subserviço).
alter table servico_insumos
  add column if not exists subservico_id uuid references servicos(id) on delete restrict;

alter table servico_insumos alter column insumo_id drop not null;

-- Exatamente um dos dois por linha.
alter table servico_insumos drop constraint if exists chk_si_componente_um;
alter table servico_insumos add constraint chk_si_componente_um check (
  (insumo_id is not null and subservico_id is null) or
  (insumo_id is null and subservico_id is not null)
);

-- Um serviço não pode se conter diretamente.
alter table servico_insumos drop constraint if exists chk_si_no_self;
alter table servico_insumos add constraint chk_si_no_self check (
  subservico_id is null or subservico_id <> servico_id
);

-- Não repetir o mesmo subserviço no mesmo pai. (A unique antiga (servico_id,
-- insumo_id) já cobre insumos — NULLs são distintos, então subserviços não
-- colidem nela.)
create unique index if not exists uq_si_servico_subservico
  on servico_insumos (servico_id, subservico_id) where subservico_id is not null;

create index if not exists ix_si_subservico on servico_insumos (subservico_id);

-- 2. Trigger anti-ciclo: ao inserir/atualizar uma linha de subserviço, recusa se
--    o subserviço já alcança (direta ou indiretamente) o serviço pai.
create or replace function tg_servico_insumos_no_cycle() returns trigger
language plpgsql as $$
begin
  if new.subservico_id is null then
    return new;
  end if;
  if new.subservico_id = new.servico_id then
    raise exception 'Um serviço não pode conter ele mesmo.' using errcode = 'check_violation';
  end if;
  -- partindo do subserviço, se alcançarmos o pai (servico_id), há ciclo.
  if exists (
    with recursive reach as (
      select new.subservico_id as sid, 1 as depth
      union all
      select si.subservico_id, r.depth + 1
      from reach r
      join servico_insumos si on si.servico_id = r.sid
      where si.subservico_id is not null and r.depth < 50
    )
    select 1 from reach where sid = new.servico_id
  ) then
    raise exception 'A composição criaria um ciclo entre serviços.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_si_no_cycle on servico_insumos;
create trigger trg_si_no_cycle
  before insert or update on servico_insumos
  for each row execute function tg_servico_insumos_no_cycle();

-- 3. Custo unitário RECURSIVO. Explode cada serviço em contribuições de insumos-
--    folha, acumulando o multiplicador ao descer pelos subserviços; soma por
--    serviço-raiz. Guarda de profundidade (< 20) por segurança extra.
create or replace view servicos_custo as
with recursive expand as (
  select si.servico_id as root_id,
         si.insumo_id,
         si.subservico_id,
         si.coeficiente::numeric as mult,
         1 as depth
  from servico_insumos si
  union all
  select e.root_id,
         si.insumo_id,
         si.subservico_id,
         e.mult * si.coeficiente,
         e.depth + 1
  from expand e
  join servico_insumos si on si.servico_id = e.subservico_id
  where e.subservico_id is not null and e.depth < 20
)
select s.id        as servico_id,
       s.codigo,
       s.descricao,
       s.unidade,
       coalesce(a.custo, 0)::numeric(14,4) as custo_unitario
from servicos s
left join (
  select e.root_id, sum(e.mult * i.valor_unitario) as custo
  from expand e
  join insumos i on i.id = e.insumo_id
  group by e.root_id
) a on a.root_id = s.id;
