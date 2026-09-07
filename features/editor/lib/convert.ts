import type {
  DefaultDayImage,
  EditorItineraryContent,
  EnrichedItinerary,
  GeminiActivity,
} from "@/types/itinerary";
import type { EditableActivity, EditableItinerary } from "../types";

const FALLBACK_IMAGE: DefaultDayImage = { source: "default", path: "/branding/default-day.jpg", triedQueries: [] };

export function toEditableItinerary(generated: EnrichedItinerary): EditableItinerary {
  return {
    overview: generated.overview,
    days: generated.days.map((day, index) => ({
      id: crypto.randomUUID(),
      originIndex: index,
      day: day.day,
      title: day.title,
      introduction: day.introduction,
      activities: day.activities.map((activity) => ({ id: crypto.randomUUID(), ...activity })),
      recommendations: day.recommendations.map((value) => ({ id: crypto.randomUUID(), value })),
      tips: day.tips.map((value) => ({ id: crypto.randomUUID(), value })),
      // "Datos" manuales del agente (texto libre). Itinerarios previos a esta
      // función no lo tienen — se cae a lista vacía sin romper el editor.
      manualNotes: (day.manualNotes ?? []).map((note) => ({
        id: crypto.randomUUID(),
        title: note.title,
        body: note.body,
      })),
      // Itinerarios generados antes de la Fase 6 (Unsplash) no tienen `image`
      // guardado — nunca romper el editor por datos de un esquema anterior.
      image: day.image ?? FALLBACK_IMAGE,
    })),
  };
}

function stripId(activity: EditableActivity): GeminiActivity {
  const copy: Partial<EditableActivity> = { ...activity };
  delete copy.id;
  return copy as GeminiActivity;
}

/** Payload exacto que exige editorItineraryContentSchema — nada más. */
export function toEditorContent(editable: EditableItinerary): EditorItineraryContent {
  return {
    overview: editable.overview,
    // `day` se renumera aquí por posición (1..N), no se copia el que traía
    // el estado editable: es la garantía final, en el único lugar por el
    // que pasa todo guardado, de que agregar/eliminar/reordenar días nunca
    // deja huecos ni duplicados en la numeración persistida.
    days: editable.days.map((day, index) => ({
      day: index + 1,
      title: day.title,
      introduction: day.introduction,
      activities: day.activities.map(stripId),
      recommendations: day.recommendations.map((item) => item.value),
      tips: day.tips.map((item) => item.value),
      manualNotes: day.manualNotes.map((note) => ({ title: note.title, body: note.body })),
    })),
  };
}

export type EditorSavePayload = {
  content: EditorItineraryContent;
  /**
   * Mismo largo y orden que `content.days`: de qué posición del
   * `EnrichedItinerary` original viene cada día (o `null` si se agregó en
   * el editor), para que `updateItineraryContent` sepa de dónde copiar
   * `image` — ver el comentario de `EditableDay.originIndex`.
   */
  dayOrigins: (number | null)[];
};

/** Igual que toEditorContent, pero además viaja el origen de cada día para preservar `image` en el servidor. */
export function toEditorSavePayload(editable: EditableItinerary): EditorSavePayload {
  return {
    content: toEditorContent(editable),
    dayOrigins: editable.days.map((day) => day.originIndex),
  };
}
