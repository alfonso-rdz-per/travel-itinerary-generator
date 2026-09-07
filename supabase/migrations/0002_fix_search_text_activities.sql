-- 0002_fix_search_text_activities.sql
-- Corrige el trigger set_itinerary_search_text: los días generados por
-- Gemini guardan sus lugares en activities[], no en places[] (places[] solo

-- existe en json_data.input, lo capturado por el agente en el formulario).
-- Ver ARCHITECTURE.md sección 3 y prompts/itinerary-generator.md sección 10.
--
-- CREATE OR REPLACE reemplaza la función en su lugar: el trigger existente
-- (trg_itineraries_search_text) sigue apuntando a ella sin necesidad de
-- recrearlo. Seguro de ejecutar sobre la base ya inicializada con 0001_init.sql.

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

-- Las filas ya existentes recalculan su search_text automáticamente la
-- próxima vez que se actualicen (autosave del editor, regeneración, etc.);
-- no se fuerza un backfill aquí para no alterar su updated_at.
