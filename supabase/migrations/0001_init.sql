-- 0001_init.sql
-- Esquema inicial de Wander Travel (Wander Travel).
-- Ver ARCHITECTURE.md, sección 3, para el diseño completo.
--
-- Este script es idempotente en la medida de lo posible, pero está pensado
-- para ejecutarse UNA sola vez sobre un proyecto Supabase nuevo.

-- Necesaria para búsqueda por coincidencia parcial (ILIKE-like) eficiente.
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Tabla itineraries
-- ---------------------------------------------------------------------------

create table public.itineraries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  passenger_name text not null,
  destination    text not null,
  start_date     date not null,
  end_date       date not null,
  observations   text,
  status         text not null default 'draft'
                   check (status in ('draft', 'generating', 'ready', 'error')),
  json_data      jsonb not null default '{}'::jsonb,
  pdf_url        text,
  search_text    tsvector,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint valid_dates check (end_date >= start_date)
);

comment on table public.itineraries is
  'Itinerarios de viaje creados por agentes. json_data es la fuente de verdad; el PDF siempre se regenera a partir de ella.';

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

-- Listado del dashboard: itinerarios del usuario, más recientes primero.
create index idx_itineraries_user_updated
  on public.itineraries (user_id, updated_at desc);

-- Búsqueda instantánea por texto combinado (pasajero + destino + observaciones + lugares).
create index idx_itineraries_search
  on public.itineraries using gin (search_text);

-- Búsqueda por coincidencia parcial directa sobre destino/pasajero (ej. "Kioto" dentro de "Kioto, Japón").
create index idx_itineraries_destination_trgm
  on public.itineraries using gin (destination gin_trgm_ops);

create index idx_itineraries_passenger_trgm
  on public.itineraries using gin (passenger_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_itineraries_updated_at
before update on public.itineraries
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- search_text automático
--
-- Combina: nombre del pasajero + destino + observaciones + todos los
-- registros "lugar / actividad" capturados por el usuario
-- (json_data.input.days[].places[].{place,activity}) y los generados por la
-- IA (json_data.generated.days[].activities[].{place,activity}), para que la
-- búsqueda del dashboard funcione tanto sobre borradores como sobre
-- itinerarios ya generados.
-- ---------------------------------------------------------------------------

create or replace function public.set_itinerary_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text :=
    to_tsvector(
      'spanish',
      coalesce(new.passenger_name, '') || ' ' ||
      coalesce(new.destination, '') || ' ' ||
      coalesce(new.observations, '') || ' ' ||
      coalesce(
        (
          select string_agg(
            coalesce(entry ->> 'place', '') || ' ' || coalesce(entry ->> 'activity', ''),
            ' '
          )
          from jsonb_array_elements(coalesce(new.json_data #> '{input,days}', '[]'::jsonb)) as day,
               jsonb_array_elements(coalesce(day -> 'places', '[]'::jsonb)) as entry
        ),
        ''
      ) || ' ' ||
      coalesce(
        (
          select string_agg(
            coalesce(entry ->> 'place', '') || ' ' || coalesce(entry ->> 'activity', ''),
            ' '
          )
          from jsonb_array_elements(coalesce(new.json_data #> '{generated,days}', '[]'::jsonb)) as day,
               jsonb_array_elements(coalesce(day -> 'activities', '[]'::jsonb)) as entry
        ),
        ''
      )
    );
  return new;
end;
$$;

create trigger trg_itineraries_search_text
before insert or update on public.itineraries
for each row
execute function public.set_itinerary_search_text();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Cada agente únicamente puede ver y modificar sus propios itinerarios.
-- ---------------------------------------------------------------------------

alter table public.itineraries enable row level security;

create policy "itineraries_select_own"
  on public.itineraries for select
  using (user_id = auth.uid());

create policy "itineraries_insert_own"
  on public.itineraries for insert
  with check (user_id = auth.uid());

create policy "itineraries_update_own"
  on public.itineraries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "itineraries_delete_own"
  on public.itineraries for delete
  using (user_id = auth.uid());
