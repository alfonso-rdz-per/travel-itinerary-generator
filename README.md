# Travel Itinerary & Proposal Generator

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

Aplicación web interna que permite a los agentes de una agencia de viajes crear
**itinerarios y propuestas comerciales profesionales en minutos**: el agente captura
solo los datos esenciales del viaje (pasajero, destino, fechas, lugares por día) y
la IA redacta los textos, selecciona imágenes y produce un PDF listo para enviar
al cliente.

> Proyecto real desarrollado para una agencia de viajes. Este repositorio es una
> versión **anonimizada** para portafolio: se sustituyeron el nombre, la identidad
> gráfica y las credenciales del cliente por valores genéricos (`Wander Travel`).
> Ningún dato real de clientes, viajeros ni claves de API está incluido.

## Qué demuestra este proyecto

- Arquitectura full‑stack con **Next.js 16 (App Router)** — Server Components,
  Server Actions y Route Handlers como backend, sin API REST separada.
- Integración de **IA generativa** (OpenRouter / Gemini) con un contrato de salida
  estricto en JSON validado con **Zod**, más un prompt maestro versionado y
  desacoplado del código (`prompts/`).
- **Supabase**: PostgreSQL con migraciones SQL, autenticación y **Row Level
  Security** para aislar los datos de cada agente.
- Generación de **PDF** a medida con `@react-pdf/renderer` (portada, membrete,
  numeración "Página X de Y", fuentes embebidas).
- Búsqueda y atribución de fotografías vía **Unsplash API**, con caché y una
  imagen de respaldo cuando no hay resultados.
- **Autosave** en el editor (debounce + guardado al dejar de escribir) para que
  nunca se pierda contenido.
- Separación estricta `app / components / features / services / hooks / lib /
  types / utils`, TypeScript estricto y validación en cada frontera.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS 4, shadcn/ui |
| Backend | Next.js Server Actions + Route Handlers |
| Base de datos | Supabase (PostgreSQL, Auth, Storage, RLS) |
| IA | OpenRouter (API compatible con OpenAI) / Google Gemini |
| Imágenes | Unsplash API |
| PDF | `@react-pdf/renderer` |
| Deploy | Vercel |

## Documentación del proyecto

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — especificación funcional (fuente de verdad).
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — decisiones técnicas y contrato de datos.

## Primeros pasos

```bash
npm install
cp .env.local.example .env.local   # completar con claves propias
npm run dev
```

Abrir <http://localhost:3000>.

Para una ejecución completa se necesita un proyecto de Supabase (aplicar las
migraciones de `supabase/migrations/`), una clave de OpenRouter y una Access Key
de Unsplash. Ver [`.env.local.example`](./.env.local.example).

## Flujo principal

```mermaid
flowchart LR
    A[Login] --> B[Dashboard]
    B --> C[Nuevo itinerario]
    C --> D[Formulario<br/>datos esenciales]
    D --> E[Generar con IA]
    E --> F[Editor<br/>autosave]
    F --> G[Generar PDF]
    G --> H[Descargar]
```

## Arquitectura (alto nivel)

```mermaid
flowchart TD
    UI[Next.js App Router<br/>Server + Client Components]
    SA[Server Actions]
    UI --> SA
    SA --> DB[(Supabase<br/>PostgreSQL + RLS)]
    SA --> AI[OpenRouter / Gemini<br/>JSON validado con Zod]
    SA --> IMG[Unsplash API<br/>búsqueda + atribución]
    SA --> PDF[react-pdf<br/>portada · membrete · numeración]
    AUTH[Supabase Auth] -.protege rutas.-> UI
```

## Estructura

```
app/          Rutas (grupos (app) y (auth)) y route handlers de PDF
components/    UI reutilizable (shadcn/ui + componentes compartidos)
features/      Lógica por dominio: auth, dashboard, editor, itinerary-form,
              proposals, pdf
services/      Clientes externos: supabase, gemini, unsplash
prompts/       Prompts maestros de IA (versionados, fuera del código)
supabase/      Migraciones SQL
types/         Tipos de dominio y de la base de datos
```

## Licencia

[MIT](./LICENSE)
