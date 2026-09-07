# Arquitectura del Proyecto — Wander Travel

Este documento complementa a `PROJECT_SPEC.md` (fuente de verdad funcional) con las decisiones técnicas aprobadas. Ningún punto aquí contradice el spec; donde el spec dejaba algo abierto, este documento fija el criterio a seguir durante el desarrollo.

Estado: **Aprobado — 2026-08-06**. Antes de implementar cualquier fase conviene releer este archivo.

---

## 0. Decisiones aprobadas y cambios sobre la propuesta inicial

Aprobado sin cambios:
- `@react-pdf/renderer` para generación de PDF.
- `pg_trgm` para mejorar la búsqueda por texto parcial.
- Columna `status` en `itineraries` con valores `draft`, `generating`, `ready`, `error`.
- Zod para validación de formularios, Server Actions y respuesta de Gemini.
- Server Actions como backend principal.
- Row Level Security (RLS) en Supabase.
- Estructura de carpetas y capas (`app / components / features / services / hooks / lib / types / utils / prompts`).

Cambios solicitados respecto a la propuesta inicial:

1. **Sin registro público.** Los usuarios se crean manualmente desde Supabase Auth (panel de Supabase). No se desarrollará ningún módulo de administración de usuarios en la v1.
2. **Portada y membrete se quedan locales**, dentro del proyecto (`public/branding/`), no en Supabase Storage. **(Fase 8 — 2026-08-08)** Esto sigue siendo así para los assets de marca (`cover.png`, `letterhead.png`, `default-day.jpg`), pero sí se creó un bucket privado de Storage (`pdfs`, `supabase/migrations/0003_pdf_storage.sql`) para cachear el **PDF ya generado** de cada itinerario — ver sección 7.
3. **Recuperación de contraseña** se agrega al flujo de autenticación, usando Supabase Auth.
4. **Contenido generado por Gemini ampliado.** Cada día del itinerario debe incluir: título atractivo, descripción, recomendaciones, consejos útiles, información importante del día, y palabras clave para búsqueda de imágenes. Todo se guarda dentro de `json_data`.
5. **(Fase 5 — 2026-08-07) El esquema de respuesta de Gemini sigue exactamente `prompts/itinerary-generator.md`, no el boceto original de esta sección.** El prompt maestro (que el equipo nunca modifica en tiempo de ejecución) define su propio contrato de salida en sus secciones 10 y 17: `overview.description` (no `summary`/`importantInfo`), `days[].introduction`, `days[].activities[]` con `imageSearch` **por actividad** (no `imageSearchKeywords` por día), `recommendations[]` y `tips[]` (no `usefulTips`). Como el prompt es la fuente de verdad del contenido y no se copia dentro del código, el esquema de Zod en `types/itinerary.ts` se ajustó a esa estructura real; las secciones 3 y 5 de este documento reflejan ya el contrato vigente.

---

## 1. Arquitectura general

Capas, de arriba a abajo:

- **`app/`** — solo páginas y layouts (Server Components por defecto). Sin lógica de negocio.
- **`components/ui/`** — primitivas de shadcn/ui. **`components/shared/`** — piezas reutilizables genéricas (header, empty states).
- **`features/*`** — un módulo por dominio (`auth`, `dashboard`, `itinerary-form`, `editor`, `pdf`), cada uno con sus componentes, Server Actions y tipos propios. Aquí vive la lógica de negocio.
- **`services/*`** — único lugar que habla con APIs externas (Supabase, Gemini, Unsplash). Nunca se llama a un `fetch` externo desde un componente ni desde `features` directamente.
- **`prompts/`** — plantillas de texto para Gemini, separadas del código que las usa.
- **`types/`** — `database.ts` generado por Supabase CLI (fuente única de verdad de tipos de BD) + tipos de dominio (`itinerary.ts`) + tipos de respuestas de APIs externas.
- **Server Actions** como backend principal para mutaciones (crear/editar/eliminar itinerario, generar con IA, autenticación). **Route Handler** solo donde una Server Action no aplica: la descarga de PDF, que debe devolver un binario con headers HTTP específicos (`app/api/itineraries/[id]/pdf/route.ts`, runtime `nodejs`).
- **Manejo de errores**: cada servicio lanza errores tipados (`GeminiError`, `UnsplashError`, `PdfGenerationError`); las Server Actions los capturan y devuelven `{ success: false, error: "mensaje claro" }`. Nunca se filtra un error técnico al usuario.
- **Validación**: Zod en formularios, Server Actions y en la respuesta de Gemini.
- **Sin librerías de estado adicionales** (Redux/Zustand): React state + Server Actions es suficiente para este flujo.

---

## 2. Estructura de carpetas definitiva

```
Wander Travel/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                # guardia de sesión + header
│   │   ├── dashboard/page.tsx
│   │   └── itineraries/
│   │       ├── new/page.tsx          # formulario
│   │       └── [id]/edit/page.tsx    # editor ✅ (Fase 7)
│   ├── api/itineraries/[id]/pdf/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                           # shadcn/ui (incl. alert-dialog.tsx ✅ Fase 9A)
│   └── shared/
├── features/
│   ├── auth/{components,actions.ts}          # signIn, signOut, requestPasswordReset, updatePassword
│   ├── dashboard/{components,actions.ts,types.ts}   # searchItineraries, deleteItinerary ✅ Fase 9A
│   ├── itinerary-form/{components,actions.ts,schema.ts}
│   ├── editor/{components,hooks,state,lib,actions.ts,types.ts}      # ✅ Fase 7; agregar/eliminar/reordenar día ✅ Fase 9A
│   └── pdf/{components,document.tsx,generatePdf.tsx,storage.ts,images.ts,fonts.ts,styles.ts,theme.ts}
├── services/
│   ├── supabase/{client.ts,server.ts,admin.ts}
│   ├── gemini/{client.ts,errors.ts,promptLoader.ts,tripInput.ts,buildPrompt.ts,responseJsonSchema.ts,promptMetadata.ts,generateItinerary.ts}
│   └── unsplash/{errors.ts,client.ts,searchPhotos.ts,cachedSearch.ts,selectBestPhoto.ts,attribution.ts,downloadTracking.ts,defaultImage.ts,enrichItinerary.ts}
├── hooks/{useAutosave.ts ✅,useDebouncedValue.ts ✅ Fase 9A,use-mobile.ts}
├── lib/{supabase-proxy.ts,utils.ts}
├── types/{database.ts,itinerary.ts,unsplash.ts}
├── utils/{formatDate.ts,errorMessages.ts}
├── prompts/itinerary-generator.md         # prompt maestro, copia exacta, nunca editado por el código
├── public/
│   └── branding/                     # portada, membrete e imagen por defecto (locales, ya provistos ✅ Fase 8)
│       ├── cover.png
│       ├── letterhead.png
│       └── default-day.jpg
├── proxy.ts
└── .env.local.example
```

Nota: `useAuth.ts` (hook dedicado), `useDebouncedSearch.ts` y `lib/{validation.ts,constants.ts}` estaban en el plan original de esta sección pero nunca se construyeron como archivos separados — no hicieron falta: la sesión se lee directamente vía `services/supabase/server.ts` en cada Server Component/Action, la búsqueda del dashboard vive en `features/dashboard/actions.ts` (`searchItineraries`, Fase 9A) usando `hooks/useDebouncedValue.ts`, y la validación vive junto a cada esquema Zod (`types/itinerary.ts`, `features/*/schema.ts`). Esta lista se corrigió en la Fase 9A para reflejar la estructura real.

`public/branding/` reemplaza al bucket de Storage mencionado en la propuesta inicial. `features/pdf/generatePdf.ts` lee estos archivos directamente del sistema de archivos del servidor (`path.join(process.cwd(), "public/branding/...")`) al renderizar. Cuando se decida migrar a Supabase Storage, solo cambia esta función — el resto del sistema no se ve afectado.

---

## 3. Base de datos (Supabase PostgreSQL)

```sql
create extension if not exists pg_trgm;

create table public.itineraries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  passenger_name text not null,
  destination    text not null,
  start_date     date not null,
  end_date       date not null,
  observations   text,
  status         text not null default 'draft'
                   check (status in ('draft','generating','ready','error')),
  json_data      jsonb not null default '{}'::jsonb,
  pdf_url        text,
  search_text    tsvector,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint valid_dates check (end_date >= start_date),
  -- (Fase 8 — 0003_pdf_storage.sql) estado del PDF cacheado, independiente
  -- de `status` (Gemini): un itinerario puede estar `ready` para editar
  -- mientras su PDF sigue sin generarse o falló por separado.
  pdf_generated_at timestamptz,
  pdf_version       integer not null default 0,
  pdf_status        text not null default 'none'
                       check (pdf_status in ('none','generating','ready','error'))
);

create index idx_itineraries_user_updated on public.itineraries(user_id, updated_at desc);
create index idx_itineraries_search on public.itineraries using gin(search_text);
create index idx_itineraries_destination_trgm on public.itineraries using gin(destination gin_trgm_ops);
create index idx_itineraries_passenger_trgm on public.itineraries using gin(passenger_name gin_trgm_ops);

alter table public.itineraries enable row level security;

create policy "select_own" on public.itineraries for select using (user_id = auth.uid());
create policy "insert_own" on public.itineraries for insert with check (user_id = auth.uid());
create policy "update_own" on public.itineraries for update using (user_id = auth.uid());
create policy "delete_own" on public.itineraries for delete using (user_id = auth.uid());

-- Trigger: actualizar updated_at en cada UPDATE.
-- Trigger: recalcular search_text (passenger_name + destination + observations + lugares del JSON) en cada INSERT/UPDATE.
```

No se crea ninguna tabla adicional (ni `profiles` ni `users`): el nombre visible del agente se toma de `user_metadata` en Supabase Auth.

Portada, membrete e imagen por defecto viven en `public/branding/` (cambio #2), no en Storage. **(Fase 8)** Sí existe un bucket privado de Storage, `pdfs` (`0003_pdf_storage.sql`), pero es exclusivamente para cachear el PDF ya renderizado de cada itinerario (`{user_id}/{itinerary_id}.pdf`, políticas RLS por `user_id`) — ver sección 7.

### Forma de `json_data`

```json
{
  "input": {
    "days": [
      {
        "places": [
          { "place": "Tokio", "activity": "" },
          { "place": "Shibuya", "activity": "Cruzar el Shibuya Crossing" },
          { "place": "Akihabara", "activity": "" }
        ]
      }
    ]
  },
  "generated": {
    "overview": {
      "title": "",
      "description": ""
    },
    "days": [
      {
        "day": 1,
        "title": "",
        "introduction": "",
        "activities": [
          {
            "place": "Tokio",
            "activity": "Cruzar el Shibuya Crossing",
            "description": "",
            "imageSearch": "Shibuya Crossing Tokyo"
          }
        ],
        "recommendations": [],
        "tips": [],
        "image": {
          "source": "unsplash",
          "id": "abc123",
          "imageSearch": "Shibuya Crossing Tokyo",
          "photographer": "",
          "photographerUrl": "https://unsplash.com/@...?utm_source=wander-travel&utm_medium=referral",
          "unsplashUrl": "https://unsplash.com/photos/abc123?utm_source=wander-travel&utm_medium=referral",
          "downloadLocation": "https://api.unsplash.com/photos/abc123/download",
          "width": 4000,
          "height": 2667,
          "color": "#0a1e2d",
          "urls": { "raw": "", "full": "", "regular": "", "small": "", "thumb": "" }
        }
      }
    ],
    "metadata": {
      "model": "gemini-flash-latest",
      "generatedAt": "2026-08-07T18:00:00.000Z",
      "durationMs": 14200,
      "promptVersion": "1.0",
      "promptHash": "…sha256 de prompts/itinerary-generator.md al momento de generar…"
    }
  }
}
```

`input` se guarda apenas el agente completa el formulario (antes de llamar a Gemini), para no perder datos si la generación falla. `generated` es el JSON validado con `geminiItineraryResponseSchema` (`overview` + `days`, `types/itinerary.ts`) más un `metadata` calculado por la app (no proviene de Gemini, nunca se valida contra su esquema) — se llena tras la llamada a Gemini y, en la Fase 6, tras asignar imágenes de Unsplash a cada `imageSearch`. Es lo que edita el Editor con autosave.

Cada registro de `places` es un objeto `{ place, activity }`: `place` es obligatorio (Fase 4), `activity` es opcional — cuando el agente no la captura, Gemini debe redactar usando únicamente el lugar.

---

## 4. Flujo de autenticación

1. `@supabase/ssr` maneja la sesión vía cookies httpOnly en Server Components, Server Actions y Route Handlers.
2. `proxy.ts` refresca la sesión en cada request; si el usuario no está autenticado y pide una ruta bajo `(app)`, redirige a `/login`; si está autenticado y pide `/login`, redirige a `/dashboard`.
3. **Login**: formulario cliente → Server Action `signIn(formData)` → `supabase.auth.signInWithPassword` → redirect a `/dashboard`. Error → mensaje genérico ("Credenciales incorrectas"), nunca el error crudo de Supabase.
4. **Logout**: Server Action `signOut()` → `supabase.auth.signOut()` → redirect a `/login`.
5. **Recuperación de contraseña** (nuevo, cambio #3):
   - `/forgot-password`: el agente ingresa su correo → Server Action `requestPasswordReset(email)` → `supabase.auth.resetPasswordForEmail(email, { redirectTo: ".../reset-password" })`.
   - Supabase envía el correo con el enlace de recuperación.
   - `/reset-password`: la sesión temporal generada por el enlace permite llamar a la Server Action `updatePassword(newPassword)` → `supabase.auth.updateUser({ password })` → redirect a `/login`.
6. Cada Server Action que toca `itineraries` vuelve a derivar el usuario desde la sesión del servidor (nunca confía en un `user_id` enviado por el cliente) — defensa en profundidad además de RLS.
7. **Sin registro público** (cambio #1): no existe página ni Server Action de sign-up. Las cuentas se crean manualmente desde el panel de Supabase (Authentication → Add user). No se construye ningún módulo de administración de usuarios en esta versión.

---

## 5. Integración con IA (OpenRouter)

- **(2026-08-29) La generación se movió de la API directa de Google a [OpenRouter](https://openrouter.ai)** (API compatible con OpenAI Chat Completions). La carpeta `services/gemini/` y los tipos (`GeminiError`, etc.) conservan el nombre por compatibilidad interna; el modelo por defecto sigue siendo Gemini (`google/gemini-2.5-flash`), sólo que enrutado por OpenRouter. Variables de entorno: `OPENROUTER_API_KEY` (obligatoria), `OPENROUTER_MODEL` y `OPENROUTER_BASE_URL` (opcionales).
- **El prompt maestro es `prompts/itinerary-generator.md`**, copia exacta (sin modificar) del archivo que el propietario del sistema edita fuera del repo. Es la única fuente del prompt: nunca se copia su texto dentro de un archivo `.ts`. Si se edita ese `.md`, la app usa la nueva versión de inmediato, sin rebuild — se lee del disco en cada generación (`services/gemini/promptLoader.ts`, sin caché en memoria).
- `services/gemini/client.ts`: resuelve la config de OpenRouter (`getOpenRouterConfig`), server-only (`import "server-only"`), `OPENROUTER_API_KEY` nunca llega al cliente. La llamada HTTP se hace con `fetch` directo (sin SDK) en `generateItinerary.ts`.
- `services/gemini/tripInput.ts`: convierte los días guardados en `json_data.input` (formato del formulario, `places`) al formato que exige el prompt maestro sección 3 (`days` con número explícito e `items`).
- `services/gemini/buildPrompt.ts`: concatena el contenido íntegro del `.md` con los datos del viaje en JSON, agregados al final — nunca se altera el texto del prompt.
- Se usa **salida estructurada** de OpenRouter (`response_format: { type: "json_schema", strict: true, ... }`) para forzar que el modelo devuelva exactamente la forma esperada. Ese JSON Schema se deriva de `geminiItineraryResponseSchema` (`services/gemini/responseJsonSchema.ts` + `z.toJSONSchema`), nunca se duplica a mano; el post-procesado quita las palabras clave que el modo estricto no soporta (`maxLength`, `minLength`, etc.) y fuerza `additionalProperties: false` + `required` completo en cada objeto.
- **`types/itinerary.ts` es la única fuente de verdad del tipo de respuesta de Gemini**: define `geminiItineraryResponseSchema` (Zod) siguiendo exactamente las secciones 10 y 17 del prompt maestro (`overview.description`; por día: `day`, `title`, `introduction`, `activities[]` con `place`/`activity`/`description`/`imageSearch` cada una, `recommendations[]`, `tips[]`). Todo el código (servicio, Server Action, y en fases futuras editor/PDF) importa el `z.infer` de este esquema — ninguna interfaz duplicada.
- `services/gemini/generateItinerary.ts`: llama al modelo vía OpenRouter (`OPENROUTER_MODEL` o `google/gemini-2.5-flash` por defecto, timeout de 90s vía `AbortController`), valida la respuesta con `geminiItineraryResponseSchema.safeParse` y confirma que el número y orden de los días coincide con lo enviado; si falla, reintenta una vez con una instrucción más estricta agregada al prompt; si vuelve a fallar (o el error no es reintentable: clave inválida, cuota excedida), lanza `GeminiError` con un `code` tipado (`config` | `auth` | `network` | `timeout` | `quota` | `invalid-json` | `invalid-schema` | `unknown`). Antes de devolver el resultado, le agrega un `metadata` (`services/gemini/promptMetadata.ts`) con el modelo usado, fecha de generación, duración aproximada (ms), versión del prompt (línea "Versión:" del `.md`) y el hash SHA-256 del contenido del `.md` en ese momento — permite auditar después con qué versión exacta del prompt se generó cada itinerario.
- **Nota de modelo:** el modelo se cambia con la variable `OPENROUTER_MODEL` (sin rebuild) — cualquier id del catálogo de OpenRouter (`openai/gpt-4o-mini`, `anthropic/claude-3.5-haiku`, etc.). El modo `strict` de structured outputs sólo lo soportan algunos modelos; Gemini 2.0 Flash y los de OpenAI sí.
- `utils/errorMessages.ts` (`getGeminiErrorMessage`) traduce cada `code` de `GeminiError` a un mensaje amigable en español; el error técnico solo se registra con `console.error`, nunca llega al usuario.
- Server Action `generateItinerary(input)` (`features/itinerary-form/actions.ts`): valida el formulario, crea el itinerario con `status = 'generating'` y `json_data.input`, llama al servicio, guarda el resultado en `json_data.generated` y pone `status = 'ready'`, o `status = 'error'` si falla (conservando `json_data.input` para no perder la captura del agente). Redirige a `/dashboard` al terminar; el editor (Fase 7) aún no existe.
- Restricciones del spec (nunca inventar vuelos/horarios/precios) ya están codificadas como reglas explícitas dentro de `prompts/itinerary-generator.md` (secciones 2 y 5).
- **(2026-08-29) "Vuelos y horarios":** el formulario (`FlightsField`, justo debajo del destino) captura una lista de datos sueltos (`description` obligatoria + `date`/`time` opcionales) que se guardan en `json_data.input.flights`. **No se envían a la IA** ni pasan por el prompt: se muestran tal cual en el PDF en un bloque propio (`features/pdf/components/FlightsSection.tsx`), justo después del Resumen General. Se preservan igual que `json_data.input.days` al editar/regenerar. Sólo son editables mientras el itinerario es borrador (el editor post-generación aún no los toca).
- **(2026-08-10) `overview.description` (Resumen General) se acortó por prompt, no por código.** Antes pedía 120–220 palabras; ahora la sección 11 del prompt pide 2–4 frases breves (~40–70 palabras) — sin agregar ningún límite nuevo en `types/itinerary.ts` (el techo de `ITINERARY_LIMITS.overviewDescription` sigue siendo solo una cota de seguridad amplia, no el objetivo real). Verificado con una generación real: 47 palabras.
- **(2026-08-10) Nueva sección 22 en el prompt**, "Ejemplo completo de itinerario ideal (referencia de estilo)": un itinerario ficticio corto (destino París) que sirve de referencia de tono/extensión/estructura, con una advertencia explícita de que Gemini nunca debe copiar sus lugares ni contenido literal — solo el estilo.
- **`place` vs `activity` vs `description`, aclarado en la sección 4 del prompt y reflejado en el PDF (`features/pdf/components/DaySection.tsx`):** `place` es el lugar y es lo único que se muestra como viñeta en el PDF; `activity` es la acción/experiencia capturada por el agente en el formulario y es **solo contexto** para que Gemini redacte `description` — nunca se muestra en el PDF; `description` es el texto que Gemini redacta y el único que aparece debajo del lugar en el documento final; `imageSearch` tampoco se muestra como texto, solo se usa para buscar la fotografía en Unsplash (Fase 6).

---

## 6. Integración con Unsplash

**(Fase 6 — 2026-08-07)** Cada día tiene **una sola imagen principal** (`json_data.generated.days[i].image`), no una por actividad — coincide con `PROJECT_SPEC.md` sección 11 ("Imagen principal" por día en el PDF). Gemini solo aporta la materia prima: un `imageSearch` por actividad (Fase 5); `services/unsplash` decide, para cada día, cuál foto real lo representa mejor.

- `services/unsplash/client.ts`: `fetch` autenticado (`Authorization: Client-ID`), timeout de 10s vía `AbortController`, server-only. Unsplash señala tanto clave inválida como límite de solicitudes excedido con HTTP 403 — se distinguen leyendo el header `X-Ratelimit-Remaining`.
- `services/unsplash/searchPhotos.ts`: busca en Unsplash **exactamente** el `imageSearch` recibido (`content_filter: "high"`, hasta 6 resultados) — nunca modifica ni inventa palabras clave.
- `services/unsplash/cachedSearch.ts`: memoiza por texto de búsqueda normalizado durante una misma generación (guarda la Promise en curso, no solo el resultado, para que búsquedas idénticas en paralelo tampoco dupliquen la llamada). Instancia nueva por generación — nunca se comparte entre usuarios.
- `services/unsplash/enrichItinerary.ts` (`enrichItineraryWithImages`), por cada día:
  1. Para cada actividad: busca con su `imageSearch`; si no hay resultados, un único intento adicional con el `place` real de la actividad (dato ya capturado, nunca inventado) — esta es la "búsqueda alternativa razonable" ante resultados vacíos.
  2. Reúne en un solo grupo todas las fotos candidatas de todas las actividades del día.
  3. Si el grupo sigue vacío, busca con el `destination` del viaje (imagen representativa del destino principal).
  4. Si sigue vacío (o Unsplash falla de forma sistémica), usa la imagen local de respaldo.
  - Nunca lanza: cualquier error de Unsplash se registra y ese día cae al siguiente nivel de la cascada — el itinerario generado por Gemini siempre se conserva.
- `services/unsplash/selectBestPhoto.ts`: de todas las candidatas reunidas para el día, elige la que mejor lo representa — nunca la primera sin más. Pondera: relevancia (orden que ya da Unsplash dentro de su propia búsqueda, 40%), orientación horizontal — mejor para una página de PDF (25%), resolución hasta ~Full HD (20%) y `likes` como aproximación disponible de calidad/composición (15%, Unsplash no expone un score de calidad). Los pesos son una heurística explícita y documentada, fácil de ajustar.
- `services/unsplash/attribution.ts`: arma el objeto que se guarda a partir de la foto elegida — `id`, `imageSearch` (la búsqueda que realmente la produjo), `photographer`, `photographerUrl`, `unsplashUrl`, `downloadLocation`, `width`, `height`, `color` (dominante, si Unsplash lo da) y el objeto `urls` completo (`raw/full/regular/small/thumb`, para web y para PDF). `photographerUrl`/`unsplashUrl` ya incluyen `utm_source`/`utm_medium` (variable `UNSPLASH_APP_NAME`) — cumplimiento listo sin cambios futuros.
- `services/unsplash/downloadTracking.ts`: dispara `links.download_location` en cuanto una foto queda asignada a un día (requisito de Unsplash al "usar" una foto) — best-effort, un fallo aquí nunca rompe la generación.
- `services/unsplash/defaultImage.ts`: imagen local de respaldo (`/branding/default-day.jpg`, todavía no provista — ver `public/branding/README.md`); guarda además `triedQueries` (qué se buscó y no encontró nada) para depurar más adelante.
- **Tipos**: `types/unsplash.ts` (forma cruda de la respuesta de Unsplash + `isUnsplashPhoto` como type guard defensivo) y `types/itinerary.ts` (`UnsplashDayImage` / `DefaultDayImage` → `ItineraryDayImage`; `EnrichedDay`/`EnrichedItinerary` extienden los tipos de Gemini de la Fase 5 con `image` por día).
- **Manejo de errores**: `enrichItineraryWithImages` nunca lanza. Si Unsplash falla de forma sistémica (config/auth/red/cuota, no solo "sin resultados" en una búsqueda puntual) se conserva igualmente el itinerario con imágenes por defecto, y el flag `imagesIncomplete` viaja hasta la Server Action → `/dashboard?created=generated&imagesIncomplete=1`, que muestra un aviso amigable no bloqueante. Nunca se filtra un error técnico al usuario.
- **Rendimiento**: sin llamadas duplicadas (cache por generación); llamadas por día ejecutadas en paralelo (`Promise.all`) entre sí.
- Pendiente para una fase futura (no bloquea la Fase 6): selector manual en el Editor (Fase 7) para cambiar la imagen de un día trayendo ~6 resultados de Unsplash.

---

## 6.5. Editor del itinerario (Fase 7 — 2026-08-07)

- **Ruta**: `app/(app)/itineraries/[id]/edit/page.tsx` (Server Component). Carga el registro (`select * ... eq id ... eq user_id`, defensa en profundidad además de RLS), y si `json_data.generated` no existe todavía (borrador, generando, o error) muestra un mensaje en vez de la pantalla del editor — nunca rompe. Desde el Dashboard, `ItineraryCard` habilita "Editar" solo cuando `status === 'ready'`.
- **Editor completamente estructurado**, nunca HTML/Markdown libre: cada campo editable (`overview.title/description`, `days[].title/introduction`, `activities[].place/activity/description`, `recommendations[]`, `tips[]`) es un control (`Input`/`Textarea`) atado 1:1 a una propiedad del mismo JSON que ya define `types/itinerary.ts`. `imageSearch` por actividad y la imagen del día (`image`) no son editables en esta fase — de solo lectura, preparado para un selector manual en una fase futura.
- **Estado**: `features/editor/state/editorReducer.ts` (un `useReducer`, sin librerías nuevas) + `features/editor/hooks/useEditorState.ts`, que expone acciones con identidad estable (envuelven `dispatch`, garantizado estable por React) para que los componentes puedan memoizarse de verdad: `DayEditorCard`, `ActivityEditor`, `OverviewCard` y cada fila de `StringListEditor` están en `React.memo` y reciben `dayIndex`/`actions` en vez de closures ya atadas — así solo se vuelve a renderizar la tarjeta cuyo contenido cambió realmente (verificado: editar el resumen general no re-renderiza las tarjetas de día, y viceversa).
- **Reordenar/agregar/eliminar**: actividades, recomendaciones y consejos usan botones subir/bajar/eliminar (`ReorderControls`), no drag & drop — evita añadir una librería nueva en esta fase. Los días en sí (`features/editor/types.ts`: `EditableDay[]`, `key` estable por `day.day`) ya están preparados para reordenarse en el futuro (array + acciones por índice), pero **no** se implementa arrastrar días todavía, como se pidió explícitamente.
- **IDs sintéticos**: cada actividad/recomendación/consejo recibe un `id` (`crypto.randomUUID()`) solo para `key` de React y para las acciones `MOVE_*`/`REMOVE_*` — nunca se persiste (`toGeminiItineraryResponse` en `features/editor/lib/convert.ts` lo quita). Importante: ese `id` nunca se usa en atributos `id`/`htmlFor` del DOM (causaría un *hydration mismatch*, servidor y cliente generan valores distintos) — los campos de actividad usan `dayIndex`+posición para eso.
- **Autoguardado** (`hooks/useAutosave.ts`, genérico, reutilizable): debounce de 1000ms sobre el payload derivado del estado (`toGeminiItineraryResponse`, memoizado — expandir/contraer un día no toca este valor, así que nunca dispara un guardado). Mientras hay un guardado en curso muestra "Guardando…"; al terminar, "Todos los cambios guardados."; si falla, el mensaje de error y un enlace "Reintentar", sin perder el estado local (el valor a guardar nunca se descarta, solo se reintenta). Un contador de "generación" evita que la respuesta de un guardado viejo pise el estado de uno más nuevo si el usuario sigue escribiendo mientras la solicitud anterior sigue en curso.
- **Validación**: la Server Action `updateItineraryContent` (`features/editor/actions.ts`) valida el contenido recibido con `geminiItineraryResponseSchema` — el mismo esquema de Zod de la Fase 5, ninguno nuevo. Nunca confía en `image`/`metadata` que llegue del navegador: siempre relee la fila actual de Supabase y preserva esos valores desde ahí antes de guardar (protege la atribución de Unsplash y el audit trail del prompt de manipulación del lado del cliente).
- **Compatibilidad con datos previos**: itinerarios generados antes de la Fase 6 no tienen `image` por día — `toEditableItinerary` lo detecta y usa la imagen local de respaldo en vez de fallar.

---

## 7. Generación del PDF

- `@react-pdf/renderer`. `features/pdf/document.tsx` define `<ItineraryDocument>`: un `<Page>` exclusivo para `<CoverPage>` (solo `cover.png` a sangre completa, sin membrete ni numeración) seguido de un único `<Page>` de contenido (resumen + un `<DaySection>` por día) que React-PDF parte automáticamente en tantas páginas físicas como haga falta; el membrete (`letterhead.png`, `fixed`) y el número de página (`fixed`, abajo a la derecha) solo viven dentro de ese segundo `<Page>`, nunca en la portada.
- Portada y membrete se leen desde `public/branding/` (rutas locales del proyecto) al momento de renderizar — cambio #2. Reemplazar esos archivos y hacer un nuevo deploy actualiza los próximos PDFs. `letterhead.png` debe ser un diseño discreto (logo pequeño / marca de agua), no una copia de `cover.png`: al reutilizar el mismo diseño a pantalla completa, aunque se dibuja fixed a opacidad baja (`styles.ts`, `letterheadBackground.opacity`), el logo y el título de la portada seguían siendo legibles como fantasma en cada página interior — corregido reemplazando el archivo, sin cambios de código (2026-08-10).
- **(Fase 8, actualizado 2026-08-10)** `app/api/itineraries/[id]/pdf/route.ts` (runtime `nodejs`): autentica al usuario, confirma que el itinerario le pertenece, carga `json_data` (única fuente de verdad). Si `pdf_status = 'ready'` y `pdf_generated_at >= updated_at` (nada cambió desde la última generación), reutiliza el PDF ya guardado en el bucket `pdfs` de Storage (`features/pdf/storage.ts`) en vez de volver a renderizar. Si no, genera con `renderToBuffer`, sube el resultado a Storage (sobrescribe el objeto existente, `upsert: true`) y actualiza `pdf_generated_at`/`pdf_version`/`pdf_status`. Responde siempre con `Content-Type: application/pdf` y `Content-Disposition: inline` (vista previa en pestaña, desde donde el navegador permite descargar/imprimir).
- `features/pdf/fonts.ts`: no se registra ningún callback de `Font.registerHyphenationCallback` personalizado — se probó `(word) => [word]` (pensado para evitar que el hyphenation por defecto partiera palabras raro en español) y expuso un bug real de `@react-pdf/renderer` que descartaba la primera letra de títulos largos al calcular el salto de línea (confirmado generando un PDF real: "Itinerario…" se convertía en "tinerario…"). El motor de hyphenation propio de la librería (el que aplica cuando no se registra ningún callback) no tiene ese problema y en la práctica sigue evitando cortes de palabra raros en español (2026-08-10).

---

## 8. Seguridad — resumen

- Service Role Key de Supabase solo en `services/supabase/admin.ts`, nunca importada desde un archivo cliente.
- Todas las claves (Gemini, Unsplash, Supabase) en variables de entorno, documentadas en `.env.local.example`.
- RLS activo en `itineraries`; además, cada Server Action re-valida el `user_id` desde la sesión del servidor.
- `proxy.ts` protege todas las rutas bajo `(app)`; `(auth)` es lo único accesible sin sesión.
- Validación de datos con Zod en cada punto de entrada (formulario, Server Actions, respuesta de Gemini) — nunca se confía en datos del navegador.
- Sin registro público ni endpoints de creación de usuarios expuestos.

---

## 9. Fases pequeñas de desarrollo

**Fase 1 — Arquitectura:** ✅ este documento. → estructura de carpetas → shadcn/ui + tema → `.env.local.example` documentado.

**Fase 2 — Supabase/Auth:** esquema SQL + RLS → CLI y generación de tipos → clients (browser/server/admin) → `proxy.ts` → login/logout → recuperación de contraseña.

**Fase 3 — Dashboard:** layout protegido con header → listado de itinerarios → tarjeta con acciones → buscador instantáneo → estado vacío.

**Fase 4 — Formulario:** info general con Zod → días/lugares dinámicos → guardado de borrador (`status='draft'`) → botón "Generar con IA".

**Fase 5 — Gemini:** ✅ cliente + carga de `prompts/itinerary-generator.md` en tiempo de ejecución → `responseJsonSchema` derivado de Zod (`overview` + días con `introduction`/`activities[]`/`recommendations`/`tips`) + validación Zod con reintento → Server Action de generación con manejo de errores tipados → redirección al dashboard (el editor llega en la Fase 7).

**Fase 6 — Unsplash:** ✅ cliente + búsqueda por `imageSearch` (sin inventar palabras clave) → selección de la mejor foto por día entre todas las actividades → atribución con UTM + download tracking → cascada de respaldo (alternativa → destino → imagen local) → cache de búsquedas duplicadas por generación. Pendiente para la Fase 7: selector manual en el editor.

**Fase 7 — Editor:** ✅ ruta `/itineraries/[id]/edit` → tarjetas estructuradas (resumen, días, actividades, recomendaciones, consejos, imagen de solo lectura) → reordenar/agregar/eliminar con botones (sin drag & drop todavía) → `useAutosave` con indicador "Guardando…"/"Todos los cambios guardados" → validación con el mismo Zod de Gemini. Pendiente: selector manual de imágenes (cuando se integre el cambio de imagen).

**Fase 8 — PDF:** componentes React PDF (portada/resumen/día/pie) → assets locales de prueba en `public/branding/` → Route Handler de descarga → botones de descarga en dashboard/editor → bucket privado `pdfs` en Storage + columnas `pdf_generated_at`/`pdf_version`/`pdf_status` (`0003_pdf_storage.sql`) para cachear el PDF ya renderizado y no regenerarlo si nada cambió desde la última vez (sección 7).

**Fase 9 — Cierre:** pruebas de RLS (aislamiento entre usuarios) → revisión de manejo de errores en las 4 integraciones → ajustes responsive/visuales → checklist contra la sección 19 de `PROJECT_SPEC.md`.

**Fase 9A — Correcciones de estabilidad, seguridad, funcionalidad y QA (2026-08-08):** ✅ sobre los hallazgos del audit de la Fase 9 — eliminación de itinerarios (`features/dashboard/actions.ts` + `components/ui/alert-dialog.tsx`) → búsqueda del dashboard corregida (usa `search_text`/`websearch_to_tsquery` + coincidencia parcial server-side, cubre pasajero/destino/país/ciudad/fecha) → editor: agregar/eliminar/reordenar días completos (mismo patrón `useReducer` + `ReorderControls` ya usado para actividades/listas) → límites de tamaño en los esquemas Zod compartidos (`ITINERARY_LIMITS`, `types/itinerary.ts`) → `useAutosave` blindado contra pérdida de datos (flush al desmontar, aviso `beforeunload`) → concurrencia acotada en las llamadas a Unsplash → `app/error.tsx` + `loading.tsx` (dashboard/editor) → ruta `dev-test-pdf` eliminada → `nativeButton={false}` en los botones-enlace de Base UI. Detalle completo de qué se corrigió y qué queda pendiente en el reporte de esa fase (fuera de este documento).

**Fase 10 — Selector manual de imagen en el editor:** ✅ `features/editor/imageActions.ts` (`searchDayImages`, `selectDayImage`, `removeDayImage`) reutiliza íntegramente `services/unsplash/*` de la Fase 6, sin duplicar lógica → nuevo estado `RemovedDayImage` (`image.source === "none"`, `types/itinerary.ts`) para cuando el agente elimina la imagen del día a propósito — distinto de `DefaultDayImage`, el PDF nunca debe mostrar `default-day.jpg` en ese caso (`features/pdf/generatePdf.tsx`) → `geminiDaySchema`/`geminiTripInputDaySchema` corregidos de `.positive()` a `.min(1)` en `day` (JSON Schema con `exclusiveMinimum` era rechazado por la API de Gemini, descubierto probando el flujo real) → `features/itinerary-form/components/ItineraryForm.tsx`: un mismo intento del agente reutiliza el mismo registro de Supabase en vez de crear uno nuevo por cada llamada a "Generar".

**Fase 11 — Ajustes de PDF y prompt (2026-08-10):** ✅ resumen general acortado por prompt (~40–70 palabras, sección 5) → nueva sección de ejemplo de referencia en `prompts/itinerary-generator.md` → el PDF muestra `place` (no `activity`) como viñeta de cada actividad, con `description` debajo (sección 5, `DaySection.tsx`) → más separación entre el título y "Pasajero · Destino · Fechas" (`styles.ts`) → corregido un bug de `@react-pdf/renderer` que cortaba la primera letra de títulos largos (sección 7, `fonts.ts`) → confirmado que `cover.png` nunca se dibuja fuera de la portada (lo que parecía "cover.png repetido" era el `letterhead.png` anterior, que reutilizaba por error el mismo diseño de la portada; se corrigió reemplazando el archivo, sin cambios de código).

---

## 10. Despliegue — Cloudflare Workers (OpenNext)

**Decisión — 2026-08-08.** El destino de producción **no es Vercel**: será **Cloudflare Workers**, desplegado con `@opennextjs/cloudflare` (el adaptador actual recomendado para correr Next.js completo — Server Components, Server Actions, Route Handlers, `proxy.ts` — sobre Workers). No se usará Cloudflare Pages en modo estático, porque el proyecto necesita backend real (Server Actions, Route Handler de PDF). **Esta sección es solo de análisis y decisión: todavía no se creó ningún archivo de configuración de despliegue** (`wrangler.toml`, adaptador instalado, etc.) — eso queda para cuando se aborde el despliegue en sí.

### Por qué no se usó `export const maxDuration`

`maxDuration` es un route segment config **específico de Vercel**: le dice a sus Serverless/Edge Functions cuánto tiempo de reloj de pared pueden vivir antes de que la plataforma las mate. El adaptador de OpenNext para Cloudflare no lo interpreta — declararlo en `app/api/itineraries/[id]/pdf/route.ts` o en `features/itinerary-form/actions.ts` habría sido código muerto y engañoso para el runtime real de este proyecto. Por eso, en la Fase 9A, ese hallazgo del audit se resolvió con este análisis en vez de con ese código.

### Modelo real de límites en Cloudflare Workers

- Cloudflare Workers se limita por **tiempo de CPU** (cómputo real dentro del isolate), no por duración de reloj de pared. El tiempo que una solicitud pasa **esperando** una respuesta de red (`fetch` a Gemini, Unsplash o a la API de Supabase) **no consume** presupuesto de CPU — solo cuenta el trabajo síncrono real (parseo, serialización, render).
- El límite de CPU se configura en `wrangler.toml` (propiedad `limits.cpu_ms`) al momento del despliegue real, todavía no creado en este repo. El valor máximo configurable depende del plan de Cloudflare contratado y **cambia con el tiempo** — debe verificarse contra la documentación vigente de Cloudflare en el momento en que se arme el despliegue, no asumirse de antemano.
- Consecuencia práctica: el timeout de 90s de Gemini (`services/gemini/generateItinerary.ts`) y las llamadas a Unsplash son mayormente espera de red, no cómputo — el riesgo de que una generación normal agote el presupuesto de CPU de Cloudflare es bajo. Esto **debe confirmarse con pruebas reales sobre Cloudflare** (`wrangler dev` o preview), no darse por resuelto solo por este análisis.

### 🔴 Hallazgo nuevo, más urgente que el `maxDuration` original: `sharp` y `fs` no son compatibles con el runtime de Workers

Al revisar qué implica correr `features/pdf/*` sobre Cloudflare (`workerd`, basado en V8 isolates, no un proceso Node.js completo):

- **`sharp` (`features/pdf/images.ts`) es un addon nativo de Node** — envuelve `libvips`, una librería C compilada. `workerd` no puede cargar addons nativos bajo ninguna circunstancia, ni siquiera con la bandera de compatibilidad `nodejs_compat` (esa bandera solo emula un subconjunto de APIs de Node en JavaScript/WASM puro, nunca binarios nativos precompilados). **`sharp` no va a funcionar en Cloudflare Workers tal como está implementado hoy.**
- **`features/pdf/fonts.ts`, `generatePdf.tsx` e `images.ts` leen archivos locales con `fs.readFile`/`path.join(process.cwd(), ...)`** (las 4 fuentes Montserrat, `cover.png`, `letterhead.png`, `default-day.jpg`). Cloudflare Workers no expone un sistema de archivos tradicional en tiempo de ejecución en esa forma — OpenNext sirve los assets estáticos por otro mecanismo (bindings de Assets/import de módulo). Estas lecturas muy probablemente fallan sin adaptarlas.
- Esto golpea directamente a la funcionalidad más importante del sistema (generación del PDF, `PROJECT_SPEC.md` sección 11) y es, en la práctica, **el bloqueante real de despliegue** — más urgente que el `maxDuration` original que motivó este análisis.

### Por qué esto no se corrige en la Fase 9A

Las instrucciones explícitas de esta fase son "no cambies tecnologías" y "no hagas todavía ninguna configuración de despliegue". Reemplazar `sharp` (por ejemplo, por una librería de procesamiento de imágenes basada en WASM compatible con Workers) o mover la generación de PDF a un servicio Node.js aparte alcanzable por HTTP desde el Worker son decisiones de arquitectura reales, con trade-offs propios, que merecen su propia fase y aprobación explícita — no un parche dentro de correcciones de estabilidad.

**Recomendación:** crear una fase dedicada (ej. "Fase 9B — Compatibilidad con Cloudflare Workers") **antes del primer despliegue real**, que cubra: reemplazo o aislamiento de `sharp`, migración de las lecturas `fs` de fuentes/branding a assets bindings de OpenNext, y una prueba de humo del flujo completo (login → generar → editar → PDF) corriendo de verdad sobre `wrangler dev`/preview de Cloudflare — no solo sobre `next dev` local, que no expone ninguno de estos problemas porque corre en Node.js real.
