import type { GeminiActivity, GeminiOverview, ItineraryDayImage } from "@/types/itinerary";

/**
 * Espejo editable de GeminiActivity/GeminiDay/EnrichedItinerary: agrega un
 * `id` sintético (solo para keys de React y reordenar) a cada elemento de
 * lista. Nunca se persiste — toEditorContent() lo quita antes de
 * guardar. `image` viaja sin cambios: en esta fase es de solo lectura.
 */
export type EditableActivity = GeminiActivity & { id: string };

export type EditableStringItem = { id: string; value: string };

/** "Datos" manuales del día (texto libre del agente, la IA no los toca). */
export type EditableManualNote = { id: string; title: string; body: string };

export type EditableListKey = "recommendations" | "tips";

export type EditableDay = {
  /** Solo para `key`/reordenar en React — nunca se persiste (ver toEditorContent). */
  id: string;
  /**
   * Posición (0-based) de este día en `EnrichedItinerary.days` tal como
   * llegó del servidor al abrir el editor, o `null` si el día se creó en el
   * editor ("Agregar día", sin imagen de Unsplash real). Viaja al servidor
   * junto con el contenido (`updateItineraryContent`) únicamente para que
   * la Server Action sepa de qué día original copiar `image` — nunca se usa
   * como fuente de ningún otro dato: la Server Action solo lo usa para
   * indexar dentro de las propias imágenes YA guardadas de este mismo
   * itinerario: un valor manipulado en el cliente, en el peor caso, solo
   * logra copiar la imagen de otro día del mismo itinerario — nunca datos
   * de otro usuario ni de otro registro.
   */
  originIndex: number | null;
  day: number;
  title: string;
  introduction: string;
  activities: EditableActivity[];
  recommendations: EditableStringItem[];
  tips: EditableStringItem[];
  manualNotes: EditableManualNote[];
  image: ItineraryDayImage;
};

export type EditableItinerary = {
  overview: GeminiOverview;
  days: EditableDay[];
};
