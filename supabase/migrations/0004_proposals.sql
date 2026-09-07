-- 0004_proposals.sql
-- Nueva función: Generador de Propuestas de Viaje.
--
-- Tabla independiente de `itineraries`. No modifica ninguna tabla, índice,
-- política ni función existente. Reutiliza:
--   - public.set_updated_at()  (definida en 0001_init.sql)
--   - el bucket privado `pdfs` (definido en 0003_pdf_storage.sql): los PDF de
--     propuestas se guardan como `{user_id}/proposal-{id}.pdf`, cubierto por
--     las mismas políticas RLS por `user_id` que ya existen para ese bucket.
--
-- Los PRECIOS viven dentro de json_data.input.services[].price como número.
-- El total NUNCA se calcula aquí ni lo toca la IA: se suma en código
-- (features/proposals/money.ts). A la IA ni siquiera se le envían los precios.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Tabla proposals
-- ---------------------------------------------------------------------------

create table public.proposals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,

  -- Cliente
  client_name      text not null,
  client_email     text,
  client_phone     text,

  -- Viaje
  destination      text not null,
  start_date       date,
  end_date         date,
  num_days         integer,
  num_travelers    integer,
  trip_type        text,

  -- Propuesta
  title            text,
  currency         text not null default 'MXN'
                     check (currency in ('MXN', 'USD', 'EUR')),

  status           text not null default 'draft'
                     check (status in ('draft', 'generating', 'ready', 'error')),

  -- { input: { client, trip, proposal, services[] }, generated: { presentation, tripOverview, services[], closing, image, metadata } }
  json_data        jsonb not null default '{}'::jsonb,

  -- PDF cacheado (bucket `pdfs`), independiente de `status` — mismo criterio que itineraries (0003).
  pdf_url          text,
  pdf_generated_at timestamptz,
  pdf_version      integer not null default 0,
  pdf_status       text not null default 'none'
                     check (pdf_status in ('none', 'generating', 'ready', 'error')),

  search_text      tsvector,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint proposals_valid_dates check (end_date is null or start_date is null or end_date >= start_date)
);

comment on table public.proposals is
  'Propuestas comerciales de viaje creadas por agentes. json_data es la fuente de verdad; el PDF se regenera a partir de ella. Los precios son datos comerciales del agente, la IA solo redacta.';

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index idx_proposals_user_updated
  on public.proposals (user_id, updated_at desc);

create index idx_proposals_search
  on public.proposals using gin (search_text);

create index idx_proposals_client_trgm
  on public.proposals using gin (client_name gin_trgm_ops);

create index idx_proposals_destination_trgm
  on public.proposals using gin (destination gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- updated_at automático (reutiliza la función existente de 0001_init.sql)
-- ---------------------------------------------------------------------------

create trigger trg_proposals_updated_at
before update on public.proposals
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- search_text automático
--
-- Combina: nombre del cliente + destino + tipo de viaje + título + notas +
-- nombres y lugares de cada servicio capturado por el agente
-- (json_data.input.services[].{name,place}).
-- ---------------------------------------------------------------------------

create or replace function public.set_proposal_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text :=
    to_tsvector(
      'spanish',
      coalesce(new.client_name, '') || ' ' ||
      coalesce(new.destination, '') || ' ' ||
      coalesce(new.trip_type, '') || ' ' ||
      coalesce(new.title, '') || ' ' ||
      coalesce(new.json_data #>> '{input,proposal,notes}', '') || ' ' ||
      coalesce(
        (
          select string_agg(
            coalesce(service ->> 'name', '') || ' ' || coalesce(service ->> 'place', ''),
            ' '
          )
          from jsonb_array_elements(coalesce(new.json_data #> '{input,services}', '[]'::jsonb)) as service
        ),
        ''
      )
    );
  return new;
end;
$$;

create trigger trg_proposals_search_text
before insert or update on public.proposals
for each row
execute function public.set_proposal_search_text();

-- ---------------------------------------------------------------------------
-- Row Level Security — cada agente solo ve y modifica sus propias propuestas.
-- ---------------------------------------------------------------------------

alter table public.proposals enable row level security;

create policy "proposals_select_own"
  on public.proposals for select
  using (user_id = auth.uid());

create policy "proposals_insert_own"
  on public.proposals for insert
  with check (user_id = auth.uid());

create policy "proposals_update_own"
  on public.proposals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "proposals_delete_own"
  on public.proposals for delete
  using (user_id = auth.uid());
