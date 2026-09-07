Sistema Inteligente de Generación de Itinerarios para Agencia de Viajes

Versión: 1.0

Estado: Planeación

Autor: Alfonso Rodríguez

1. Objetivo General
Descripción

Este proyecto consiste en desarrollar un sistema web interno para una agencia de viajes.

El sistema NO será un sitio público.

Únicamente será utilizado por los agentes de viajes de la empresa para crear itinerarios profesionales de forma rápida utilizando Inteligencia Artificial.

El objetivo principal es reducir drásticamente el tiempo necesario para elaborar un itinerario.

Actualmente un agente debe redactar manualmente cada día del viaje.

Con este sistema el agente únicamente proporcionará la información esencial del viaje.

La Inteligencia Artificial será la encargada de:

redactar los textos
organizar la información
crear un formato profesional
seleccionar imágenes automáticamente
generar un PDF listo para enviar al cliente.
Objetivos del sistema

El sistema debe permitir:

iniciar sesión de forma segura
crear itinerarios
editar itinerarios existentes
eliminar itinerarios
buscar itinerarios rápidamente
almacenar todos los itinerarios
generar PDFs profesionales
volver a generar PDFs cuando un itinerario sea modificado
Objetivos secundarios

Reducir el tiempo de elaboración de un itinerario.

Mantener una apariencia profesional.

Estandarizar el formato de todos los documentos.

Evitar escribir grandes cantidades de texto manualmente.

Facilitar modificaciones futuras.

Escalar fácilmente el sistema.

Tecnologías obligatorias

El proyecto deberá utilizar exclusivamente las siguientes tecnologías.

Frontend
Next.js 16
React
TypeScript
TailwindCSS
shadcn/ui
Backend

Next.js Server Actions

Route Handlers

Base de datos

Supabase PostgreSQL

Autenticación

Supabase Auth

Archivos

Supabase Storage

Inteligencia Artificial

Gemini API

Imágenes

Unsplash API

PDF

React PDF

Despliegue

Vercel

Filosofía del proyecto

Este sistema deberá comportarse como un software profesional para empresas.

La prioridad será:

Simplicidad.
Rapidez.
Estabilidad.
Escalabilidad.
Código limpio.

Nunca se deberán implementar soluciones improvisadas.

Toda nueva funcionalidad deberá seguir la arquitectura establecida.

2. Usuarios del Sistema

El sistema tendrá únicamente un tipo de usuario.

Agente de Viajes

El agente podrá:

iniciar sesión
cerrar sesión
crear itinerarios
editar itinerarios
eliminar itinerarios
buscar itinerarios
generar PDFs
descargar PDFs

No existirán administradores ni permisos especiales en la primera versión.

Cada usuario únicamente visualizará los itinerarios que haya creado.

3. Flujo General del Sistema

El flujo principal será el siguiente.

Login

↓

Dashboard

↓

Nuevo Itinerario

↓

Formulario

↓

Generar con IA

↓

Editor

↓

Guardar

↓

Generar PDF

↓

Descargar PDF

Todo el proyecto deberá respetar este flujo.

No deberán existir rutas innecesarias.

4. Filosofía de Uso

La filosofía del sistema es que el usuario escriba lo menos posible.

La Inteligencia Artificial realizará la mayor parte del trabajo.

El agente únicamente capturará la información indispensable.

Ejemplo.

Pasajero

Juan Pérez

Destino

Japón

Fecha

10 Mayo

Fecha Final

20 Mayo

Después construirá el viaje.

Día 1

Tokio

Shibuya

Akihabara
Día 2

Monte Fuji

Hakone
Día 3

Kioto

Templo Kiyomizu

Gion

Y nada más.

El usuario NO deberá escribir descripciones.

NO deberá redactar párrafos.

NO deberá buscar imágenes.

NO deberá diseñar el PDF.

Todo eso será responsabilidad de la IA.

5. Experiencia del Usuario (UX)

La aplicación deberá sentirse extremadamente sencilla.

El usuario deberá poder aprender a utilizarla en menos de cinco minutos.

La interfaz será moderna, limpia y minimalista.

Se utilizarán los componentes de shadcn/ui para mantener consistencia visual.

Principios de diseño
Muy pocos clics para completar una tarea.
Formularios claros.
Botones grandes y fáciles de identificar.
Espacios amplios.
Tipografía legible.
Colores sobrios y profesionales.
Animaciones discretas.
Diseño responsive para funcionar correctamente en laptops y monitores.
Flujo ideal de trabajo
El agente inicia sesión.
Entra al dashboard.
Usa el botón Nuevo Itinerario.
Captura los datos básicos del viaje.
Agrega días y lugares con los botones Agregar lugar y Agregar día.
Presiona Generar con IA.
Revisa el resultado, hace ajustes si es necesario.
Genera el PDF.
Descarga el documento o lo deja almacenado para futuras modificaciones.

# 6. Dashboard

El Dashboard será la pantalla principal del sistema después de iniciar sesión.

Su objetivo es permitir que el agente de viajes encuentre cualquier itinerario en pocos segundos y pueda crear uno nuevo de forma rápida.

## Distribución

La pantalla deberá contener:

────────────────────────────────────

Logo de la agencia

Nombre del usuario

Botón Cerrar Sesión

────────────────────────────────────

Barra de búsqueda

Botón Nuevo Itinerario

────────────────────────────────────

Lista de itinerarios

────────────────────────────────────

## Barra de búsqueda

Esta será una de las funciones más utilizadas.

Debe filtrar automáticamente mientras el usuario escribe.

Debe permitir buscar por:

- Nombre del pasajero
- Destino
- País
- Ciudad
- Fecha del viaje

Ejemplo

Usuario escribe

Japón

Resultado

Todos los itinerarios de Japón.

Si escribe

Juan

Mostrar únicamente los viajes del pasajero Juan.

No deberá ser necesario presionar Enter.

La búsqueda será instantánea.

---

## Tarjetas de itinerarios

Cada itinerario se mostrará como una tarjeta.

Cada tarjeta contendrá:

Nombre del pasajero

Destino

Fechas

Fecha de creación

Última modificación

Botones:

Editar

Descargar PDF

Eliminar

No existirá botón de Duplicar en la primera versión.

---

## Botón Nuevo Itinerario

Será el botón principal del Dashboard.

Siempre deberá permanecer visible.

Al presionarlo abrirá el formulario para crear un nuevo viaje.

---

# 7. Formulario para Crear un Itinerario

El formulario debe ser extremadamente sencillo.

El usuario nunca deberá escribir textos largos.

Toda la redacción será responsabilidad de Gemini.

## Información General

Campos:

Nombre del pasajero

Destino principal

Fecha de inicio

Fecha final

Observaciones (Opcional)

---

## Construcción del itinerario

Después aparecerá la sección

ITINERARIO

Aquí comenzará la captura de días.

Por defecto siempre existirá:

Día 1

Con un solo campo:

Lugar

Ejemplo

Lugar

Tokio

Debajo existirá el botón

Agregar Lugar

Al presionarlo aparecerá otro campo.

Lugar

Shibuya

Lugar

Akihabara

No existirá límite de lugares.

---

## Agregar Día

Debajo de cada día existirá

Agregar Día

Al presionarlo aparecerá automáticamente

Día 2

Con un lugar vacío.

El usuario podrá crear tantos días como necesite.

---

## Lo que NO hará el usuario

No escribirá párrafos.

No redactará recomendaciones.

No buscará fotografías.

No dará formato.

No escribirá títulos.

Solo capturará:

Lugar

Lugar

Lugar

Lugar

Todo lo demás será generado por la IA.

---

# 8. Generación mediante Inteligencia Artificial

Cuando el usuario presione

Generar Itinerario

El sistema recopilará toda la información capturada.

Ejemplo

Nombre

Juan Pérez

Destino

Japón

Día 1

Tokio

Shibuya

Akihabara

Día 2

Monte Fuji

Hakone

Esa información será enviada a Gemini.

---

## Gemini deberá generar

Un JSON estructurado.

Nunca HTML.

Nunca Markdown.

Nunca texto plano.

Ejemplo

{
    "cover":{},
    "overview":{},
    "days":[]
}

Cada día contendrá:

Título

Descripción

Recomendaciones

Imagen sugerida

Palabras clave para buscar imágenes

---

## Restricciones

Gemini nunca deberá inventar vuelos.

Nunca deberá inventar horarios.

Nunca deberá generar información falsa.

Cuando no conozca algún dato deberá escribir información general y útil para el viajero.

---

# 9. Integración con Unsplash

Una vez recibido el JSON.

El sistema buscará automáticamente imágenes.

Nunca se utilizarán imágenes generadas por IA.

Siempre deberán obtenerse desde Unsplash.

Gemini devolverá algo parecido a:

"imageSearch":"Tokyo Skyline"

La aplicación buscará esa imagen.

Guardará únicamente la URL.

Si no encuentra resultados.

Utilizará una imagen predeterminada.

El usuario no deberá intervenir en este proceso.

---

# 10. Editor del Itinerario

Cuando termine la generación con IA.

NO deberá generarse inmediatamente el PDF.

Primero se abrirá un editor.

El editor permitirá modificar:

Título

Resumen

Descripción

Texto de cada día

Orden de los días

Eliminar un día

Agregar un día nuevo

Cambiar la imagen utilizando nuevamente Unsplash.

Todo cambio deberá guardarse automáticamente.

No deberá existir un botón Guardar.

El sistema realizará AutoSave.

Cada pocos segundos.

Y también cuando el usuario deje de escribir.

El objetivo es que nunca se pierda información.

# 11. Generación del PDF

La generación del PDF será una de las funcionalidades más importantes del sistema.

El PDF siempre deberá mantener exactamente el mismo diseño.

No existirán múltiples plantillas.

Todos los itinerarios utilizarán la identidad gráfica oficial de la agencia.

## Diseño General

El PDF estará compuesto por:

1. Portada personalizada.
2. Resumen del viaje.
3. Un capítulo por cada día.
4. Pie de página.

La portada y el membrete serán proporcionados posteriormente por el propietario del sistema.

el equipo deberá diseñar el sistema para que estos archivos puedan reemplazarse fácilmente sin modificar el código.

La portada y el membrete deberán almacenarse como recursos del proyecto.

Nunca deberán ser generados mediante IA.

---

## Portada

La portada deberá contener:

Imagen oficial de portada (proporcionada por la agencia)

Nombre del pasajero

Destino

Fechas del viaje

Nombre de la agencia

La portada no utilizará imágenes de Unsplash.

Será siempre la imagen oficial proporcionada por la agencia.

---

## Resumen

Después de la portada aparecerá una página con:

Título del viaje

Descripción general

Información importante

Este contenido será generado por Gemini.

---

## Días del itinerario

Cada día ocupará una o varias páginas dependiendo de la cantidad de contenido.

Cada día contendrá:

Título

Imagen principal

Descripción

Recomendaciones

Lugares visitados

Las imágenes deberán provenir exclusivamente de Unsplash.

---

## Pie de página

Todas las páginas interiores utilizarán un membrete oficial.

El membrete será proporcionado posteriormente.

Deberá aparecer automáticamente en todas las páginas excepto la portada.

---

## Numeración

El PDF deberá mostrar:

Página X de Y

En la parte inferior.

---

## Calidad

El PDF deberá ser:

Profesional.

Elegante.

Fácil de leer.

Preparado para impresión.

Compatible con Adobe Acrobat.

---

# 12. Base de Datos

El sistema utilizará Supabase PostgreSQL.

La base de datos deberá ser sencilla.

No se crearán tablas innecesarias.

---

## Tabla users

Será administrada por Supabase Auth.

No se modificará.

---

## Tabla itineraries

Contendrá la información general.

Campos:

id

user_id

passenger_name

destination

start_date

end_date

json_data

pdf_url

created_at

updated_at

---

## json_data

Este será el campo más importante del sistema.

Aquí se almacenará todo el itinerario generado.

Ejemplo:

{

overview

days

images

}

El PDF nunca será la fuente principal de información.

Siempre deberá generarse a partir del JSON.

---

## Relaciones

Cada usuario podrá tener múltiples itinerarios.

Cada itinerario pertenecerá únicamente a un usuario.

No existirán clientes independientes.

El nombre del pasajero únicamente será un campo dentro del itinerario.

---

# 13. Arquitectura del Proyecto

La arquitectura deberá mantenerse limpia desde el primer día.

Nunca deberá mezclarse la lógica con la interfaz.

Toda funcionalidad deberá separarse correctamente.

La estructura será similar a la siguiente:

app/

components/

features/

services/

hooks/

lib/

types/

utils/

prompts/

public/

---

## app

Contendrá únicamente las páginas del sistema.

No deberá contener lógica de negocio.

---

## components

Componentes reutilizables.

Ejemplos:

Botones

Inputs

Tarjetas

Diálogos

Tablas

---

## features

Cada funcionalidad importante tendrá su propia carpeta.

Ejemplo:

auth

dashboard

itinerary

editor

pdf

---

## services

Toda comunicación con APIs.

Ejemplo:

Gemini

Supabase

Unsplash

---

## hooks

Custom Hooks.

Ejemplo:

useAuth

useAutosave

useSearch

---

## utils

Funciones auxiliares.

Nunca deberán contener lógica de negocio.

---

## prompts

Aquí se almacenarán todos los prompts utilizados por Gemini.

Los prompts nunca deberán escribirse directamente dentro del código.

Deberán mantenerse separados para facilitar futuras mejoras.

---

# 14. Seguridad

Toda la aplicación deberá diseñarse pensando en seguridad.

Nunca deberán exponerse claves privadas.

La Service Role Key de Supabase nunca deberá utilizarse en el cliente.

Todas las variables sensibles deberán almacenarse mediante variables de entorno.

La autenticación deberá proteger todas las rutas privadas.

Un usuario nunca podrá acceder a los itinerarios de otro usuario.

Todas las consultas deberán respetar Row Level Security (RLS) de Supabase.

No deberán existir rutas accesibles sin autenticación, excepto la pantalla de inicio de sesión.

El sistema deberá validar todos los datos antes de almacenarlos.

Nunca deberá confiar en información enviada desde el navegador.

# 15. Reglas de Desarrollo

Durante todo el desarrollo del proyecto, el equipo de desarrollo deberá seguir estrictamente las siguientes reglas.

## Antes de escribir código

Antes de implementar cualquier funcionalidad deberá:

- Analizar la arquitectura existente.
- Revisar el código relacionado.
- Identificar dependencias.
- Explicar brevemente qué archivos modificará.
- Justificar cualquier cambio importante.

Nunca deberá comenzar a programar inmediatamente sin analizar primero el contexto.

---

## Calidad del código

Todo el código deberá cumplir con las siguientes características:

- Código limpio.
- Fácil de leer.
- Modular.
- Escalable.
- Comentarios únicamente cuando sean realmente necesarios.
- Funciones pequeñas.
- Componentes reutilizables.

Nunca deberá duplicarse lógica.

Si una función puede reutilizarse deberá convertirse en un componente, hook o utilidad.

---

## TypeScript

Todo el proyecto utilizará TypeScript estricto.

No deberán utilizarse tipos "any".

Siempre deberán definirse interfaces o tipos cuando sea necesario.

---

## React

Utilizar:

- Functional Components.
- Hooks.
- Server Components cuando sea conveniente.
- Client Components únicamente cuando realmente sean necesarios.

Evitar renders innecesarios.

---

## Organización

No mezclar lógica de negocio con componentes visuales.

No escribir llamadas a APIs directamente dentro de los componentes.

Toda comunicación externa deberá pasar por la carpeta services.

---

## Variables de entorno

Todas las claves deberán almacenarse mediante variables de entorno.

Nunca escribir claves dentro del código.

---

## Manejo de errores

Toda operación deberá manejar errores.

Ejemplos:

Error de Supabase

Error de Gemini

Error de Unsplash

Error de generación del PDF

El usuario deberá recibir mensajes claros.

Nunca mostrar errores técnicos.

---

## Rendimiento

Priorizar siempre:

- rapidez
- simplicidad
- estabilidad

Evitar procesos innecesarios.

Evitar consultas duplicadas.

Optimizar imágenes cuando sea posible.

---

# 16. Integración con Gemini

Gemini será responsable únicamente del contenido.

Nunca generará HTML.

Nunca generará CSS.

Nunca generará PDFs.

Siempre responderá mediante JSON.

---

## Prompt de Gemini

El prompt deberá solicitar:

Resumen del viaje.

Descripción de cada día.

Recomendaciones.

Consejos útiles para el pasajero.

Título atractivo para cada día.

Palabras clave para buscar imágenes.

---

## Restricciones

Gemini nunca deberá:

Inventar vuelos.

Inventar hoteles.

Inventar horarios.

Inventar precios.

Si falta información deberá escribir contenido general y útil.

---

# 17. Integración con Unsplash

Unsplash será la única fuente de imágenes.

No utilizar imágenes generadas por IA.

No permitir que el usuario suba imágenes.

Cada imagen deberá buscarse utilizando las palabras clave generadas por Gemini.

Si la búsqueda falla:

Utilizar una imagen predeterminada.

---

# 18. Roadmap del Proyecto

El desarrollo deberá realizarse por fases.

Nunca desarrollar todo al mismo tiempo.

## Fase 1

Arquitectura

Configuración del proyecto

Documentación

---

## Fase 2

Supabase

Autenticación

Protección de rutas

---

## Fase 3

Dashboard

Lista de itinerarios

Buscador

---

## Fase 4

Formulario inteligente

Agregar días

Agregar lugares

---

## Fase 5

Integración con Gemini

Generación del JSON

---

## Fase 6

Integración con Unsplash

Obtención automática de imágenes

---

## Fase 7

Editor del itinerario

AutoSave

Edición del contenido

---

## Fase 8

Generación del PDF

Descarga

Almacenamiento

---

## Fase 9

Optimización

Corrección de errores

Mejoras visuales

Pruebas

---

# 19. Criterios de Aceptación

El proyecto se considerará terminado cuando cumpla todos los siguientes puntos.

✅ Login seguro mediante Supabase.

✅ Dashboard funcional.

✅ Buscador instantáneo.

✅ Crear itinerarios.

✅ Editar itinerarios.

✅ Eliminar itinerarios.

✅ Guardar JSON.

✅ Integración con Gemini.

✅ Integración con Unsplash.

✅ Editor funcional.

✅ AutoSave.

✅ Generación del PDF.

✅ Descarga del PDF.

✅ Almacenamiento en Supabase.

✅ Interfaz moderna.

✅ Código limpio.

✅ Arquitectura modular.

✅ Sin errores de TypeScript.

✅ Responsive.

---

# 20. Instrucción Permanente para el Equipo de Desarrollo

Durante todo el desarrollo deberás seguir este documento como la especificación oficial del proyecto.

Nunca deberás tomar decisiones que contradigan esta documentación.

Si detectas una posible mejora:

- Explícala.
- Justifica por qué sería mejor.
- Espera aprobación antes de implementarla.

Nunca cambies la arquitectura sin autorización.

Nunca agregues funcionalidades que no hayan sido solicitadas.

Trabaja únicamente en la tarea actual.

Cuando termines una tarea:

1. Explica qué implementaste.
2. Explica qué archivos modificaste.
3. Explica por qué tomaste esas decisiones.
4. Espera la siguiente instrucción antes de continuar.

Este documento será la fuente de verdad del proyecto durante todo su ciclo de desarrollo.