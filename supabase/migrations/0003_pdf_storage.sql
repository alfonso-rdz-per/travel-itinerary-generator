-- 0003_pdf_storage.sql
-- Fase 8: almacenamiento del PDF generado.
--
-- `itineraries.pdf_url` ya existe (0001_init.sql) y se reutiliza para
-- guardar la RUTA del objeto en Supabase Storage (no una URL firmada: esas
-- expiran, se generan al vuelo en cada descarga/vista previa).
--
-- Se agrega: fecha de generación, versión (se incrementa solo cuando se
-- vuelve a renderizar de verdad, nunca en cada clic) y estado del PDF —
-- independiente del `status` del itinerario (Gemini), porque un itinerario
-- puede estar `ready` para editar mientras su PDF sigue sin generarse o
-- falló por separado.

alter table public.itineraries
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists pdf_version integer not null default 0,
  add column if not exists pdf_status text not null default 'none'
    check (pdf_status in ('none', 'generating', 'ready', 'error'));

-- Bucket privado: los PDFs contienen datos personales del pasajero, nunca
-- deben ser públicos. Cada objeto vive en `{user_id}/{itinerary_id}.pdf` —
-- sin versiones múltiples (se sobrescribe en cada regeneración real, como
-- pide la Fase 8).
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

create policy "pdfs_select_own" on storage.objects for select
  using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "pdfs_insert_own" on storage.objects for insert
  with check (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "pdfs_update_own" on storage.objects for update
  using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "pdfs_delete_own" on storage.objects for delete
  using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);
