"use server";

import { createClient } from "@/services/supabase/server";
import type { Database } from "@/types/database";
import { formatDateRange } from "@/utils/formatDate";
import type { DashboardItinerary } from "./types";

const LIST_COLUMNS =
  "id, passenger_name, destination, start_date, end_date, status, created_at, updated_at";

type ItineraryListRow = Pick<
  Database["public"]["Tables"]["itineraries"]["Row"],
  "id" | "passenger_name" | "destination" | "start_date" | "end_date" | "status" | "created_at" | "updated_at"
>;

function toDashboardItinerary(row: ItineraryListRow): DashboardItinerary {
  return {
    id: row.id,
    passengerName: row.passenger_name,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SearchItinerariesResult =
  | { success: true; itineraries: DashboardItinerary[] }
  | { success: false; error: string };

/**
 * Búsqueda por pasajero, destino, país/ciudad (capturados dentro de
 * json_data.input/generated) y fecha — PROJECT_SPEC.md sección 6.
 *
 * Combina dos consultas, ambas acotadas a `user_id` (RLS + defensa en
 * profundidad):
 * 1. `search_text` (tsvector ya mantenido por trigger en la base de datos,
 *    ver 0001_init.sql/0002_...sql): cubre pasajero + destino +
 *    observaciones + TODOS los lugares/actividades capturados día por día,
 *    tanto del borrador como de lo generado por Gemini — es la única forma
 *    de encontrar una ciudad que el agente escribió como "lugar" de un día
 *    (ej. "Kioto") pero que no aparece en el campo `destination` ("Japón").
 * 2. Coincidencia parcial en el propio servidor (no se trae toda la tabla:
 *    se piden solo las columnas livianas del dashboard) sobre
 *    pasajero/destino/fecha — cubre fragmentos cortos que el análisis de
 *    texto completo de Postgres no soporta bien (ej. "Jap" sin completar
 *    "Japón") y fechas en el formato legible que se muestra en la UI
 *    ("1 – 3 mar 2027"), que no vive como texto en ninguna columna.
 */
export async function searchItineraries(rawQuery: string): Promise<SearchItinerariesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  const query = rawQuery.trim();

  const baseQuery = () =>
    supabase.from("itineraries").select(LIST_COLUMNS).eq("user_id", user.id);

  if (!query) {
    const { data, error } = await baseQuery().order("updated_at", { ascending: false });
    if (error) {
      console.error("[searchItineraries] list", error);
      return { success: false, error: "No se pudieron cargar tus itinerarios. Intenta de nuevo." };
    }
    return { success: true, itineraries: (data ?? []).map(toDashboardItinerary) };
  }

  const [fullTextResult, allRowsResult] = await Promise.all([
    baseQuery().textSearch("search_text", query, { type: "websearch", config: "spanish" }),
    baseQuery(),
  ]);

  if (fullTextResult.error || allRowsResult.error) {
    console.error("[searchItineraries] search", fullTextResult.error ?? allRowsResult.error);
    return { success: false, error: "No se pudo completar la búsqueda. Intenta de nuevo." };
  }

  const normalizedQuery = query.toLowerCase();
  const matched = new Map<string, DashboardItinerary>();

  for (const row of fullTextResult.data ?? []) {
    matched.set(row.id, toDashboardItinerary(row));
  }

  for (const row of allRowsResult.data ?? []) {
    if (matched.has(row.id)) continue;
    const dashboardRow = toDashboardItinerary(row);
    const haystack = [
      dashboardRow.passengerName,
      dashboardRow.destination,
      formatDateRange(dashboardRow.startDate, dashboardRow.endDate),
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(normalizedQuery)) {
      matched.set(row.id, dashboardRow);
    }
  }

  const itineraries = Array.from(matched.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return { success: true, itineraries };
}

export type DeleteItineraryResult = { success: true } | { success: false; error: string };

export async function deleteItinerary(id: string): Promise<DeleteItineraryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  // RLS (`itineraries_delete_own`) ya exige user_id = auth.uid(); el filtro
  // explícito es defensa en profundidad, igual que en el resto de las
  // Server Actions del proyecto, y evita un `delete` "exitoso" con 0 filas
  // afectadas si el id no le pertenece a este usuario.
  const { error, count } = await supabase
    .from("itineraries")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteItinerary]", error);
    return { success: false, error: "No se pudo eliminar el itinerario. Intenta de nuevo." };
  }

  if (!count) {
    return { success: false, error: "No se encontró el itinerario a eliminar." };
  }

  return { success: true };
}
