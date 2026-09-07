# Recursos de marca

Imágenes de identidad usadas por el generador de PDF (ver `ARCHITECTURE.md`, sección 7).
El código las lee por ruta fija (`features/pdf/generatePdf.tsx`), así que para
cambiar la identidad basta con **sobrescribir estos archivos** sin tocar código:

- `cover.png` — portada del itinerario (a sangre completa).
- `cover_propuesta.png` — portada de la propuesta comercial.
- `letterhead.png` — membrete de fondo en las páginas interiores.
- `default-day.jpg` — imagen de respaldo cuando Unsplash no devuelve resultados.
- `logo-blanco.png` / `trust-logo.png` — logotipos para la barra lateral y el login.

> Los archivos incluidos aquí son **placeholders genéricos**. En el proyecto real
> los proporciona la agencia.
