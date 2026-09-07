import { ITINERARY_LIMITS } from "@/types/itinerary";
import type { GeminiOverview, DefaultDayImage, ItineraryDayImage } from "@/types/itinerary";
import type { EditableDay, EditableItinerary, EditableListKey } from "../types";

type Direction = "up" | "down";

export type EditorAction =
  | { type: "UPDATE_OVERVIEW"; patch: Partial<GeminiOverview> }
  | { type: "UPDATE_DAY"; dayIndex: number; patch: Partial<Pick<EditableDay, "title" | "introduction">> }
  | {
      type: "UPDATE_ACTIVITY";
      dayIndex: number;
      activityId: string;
      patch: Partial<{ place: string; activity: string; description: string }>;
    }
  | { type: "ADD_ACTIVITY"; dayIndex: number }
  | { type: "REMOVE_ACTIVITY"; dayIndex: number; activityId: string }
  | { type: "MOVE_ACTIVITY"; dayIndex: number; activityId: string; direction: Direction }
  | { type: "UPDATE_LIST_ITEM"; dayIndex: number; listKey: EditableListKey; itemId: string; value: string }
  | { type: "ADD_LIST_ITEM"; dayIndex: number; listKey: EditableListKey }
  | { type: "REMOVE_LIST_ITEM"; dayIndex: number; listKey: EditableListKey; itemId: string }
  | { type: "MOVE_LIST_ITEM"; dayIndex: number; listKey: EditableListKey; itemId: string; direction: Direction }
  | { type: "ADD_MANUAL_NOTE"; dayIndex: number }
  | { type: "REMOVE_MANUAL_NOTE"; dayIndex: number; noteId: string }
  | {
      type: "UPDATE_MANUAL_NOTE";
      dayIndex: number;
      noteId: string;
      patch: Partial<{ title: string; body: string }>;
    }
  | { type: "ADD_DAY"; id: string }
  | { type: "REMOVE_DAY"; dayId: string }
  | { type: "MOVE_DAY"; dayId: string; direction: Direction }
  // La imagen ya viene confirmada por el servidor (selectDayImage/removeDayImage
  // en features/editor/imageActions.ts) — el reducer solo refleja localmente
  // lo que Supabase ya guardó, nunca "inventa" una imagen del lado del cliente.
  | { type: "SET_DAY_IMAGE"; dayIndex: number; image: ItineraryDayImage };

function updateDay(
  state: EditableItinerary,
  dayIndex: number,
  update: (day: EditableDay) => EditableDay,
): EditableItinerary {
  return {
    ...state,
    days: state.days.map((day, index) => (index === dayIndex ? update(day) : day)),
  };
}

/** Reutilizado para actividades, recomendaciones y consejos: sube/baja un elemento por id. */
function moveItem<T extends { id: string }>(items: T[], id: string, direction: Direction): T[] {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return items;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function createEmptyActivity() {
  return { id: crypto.randomUUID(), place: "", activity: "", description: "", imageSearch: "" };
}

function createEmptyListItem() {
  return { id: crypto.randomUUID(), value: "" };
}

function createEmptyManualNote() {
  return { id: crypto.randomUUID(), title: "", body: "" };
}

const EMPTY_DAY_IMAGE: DefaultDayImage = { source: "default", path: "/branding/default-day.jpg", triedQueries: [] };

function createEmptyDay(id: string, dayNumber: number): EditableDay {
  return {
    id,
    originIndex: null,
    day: dayNumber,
    title: "",
    introduction: "",
    activities: [createEmptyActivity()],
    recommendations: [],
    tips: [],
    manualNotes: [],
    image: EMPTY_DAY_IMAGE,
  };
}

/**
 * `day` (el número mostrado como "Día X" y lo que se persiste) siempre debe
 * reflejar la posición real en el array — agregar/eliminar/reordenar días
 * nunca debe dejar huecos ni duplicados. `id` es la identidad estable para
 * React; `day` es solo un número derivado de la posición.
 */
function renumberDays(days: EditableDay[]): EditableDay[] {
  return days.map((day, index) => (day.day === index + 1 ? day : { ...day, day: index + 1 }));
}

export function editorReducer(state: EditableItinerary, action: EditorAction): EditableItinerary {
  switch (action.type) {
    case "UPDATE_OVERVIEW":
      return { ...state, overview: { ...state.overview, ...action.patch } };

    case "UPDATE_DAY":
      return updateDay(state, action.dayIndex, (day) => ({ ...day, ...action.patch }));

    case "UPDATE_ACTIVITY":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        activities: day.activities.map((activity) =>
          activity.id === action.activityId ? { ...activity, ...action.patch } : activity,
        ),
      }));

    case "ADD_ACTIVITY":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        activities: [...day.activities, createEmptyActivity()],
      }));

    case "REMOVE_ACTIVITY":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        activities: day.activities.filter((activity) => activity.id !== action.activityId),
      }));

    case "MOVE_ACTIVITY":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        activities: moveItem(day.activities, action.activityId, action.direction),
      }));

    case "UPDATE_LIST_ITEM":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        [action.listKey]: day[action.listKey].map((item) =>
          item.id === action.itemId ? { ...item, value: action.value } : item,
        ),
      }));

    case "ADD_LIST_ITEM":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        [action.listKey]: [...day[action.listKey], createEmptyListItem()],
      }));

    case "REMOVE_LIST_ITEM":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        [action.listKey]: day[action.listKey].filter((item) => item.id !== action.itemId),
      }));

    case "MOVE_LIST_ITEM":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        [action.listKey]: moveItem(day[action.listKey], action.itemId, action.direction),
      }));

    case "ADD_MANUAL_NOTE":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        manualNotes: [...day.manualNotes, createEmptyManualNote()],
      }));

    case "REMOVE_MANUAL_NOTE":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        manualNotes: day.manualNotes.filter((note) => note.id !== action.noteId),
      }));

    case "UPDATE_MANUAL_NOTE":
      return updateDay(state, action.dayIndex, (day) => ({
        ...day,
        manualNotes: day.manualNotes.map((note) =>
          note.id === action.noteId ? { ...note, ...action.patch } : note,
        ),
      }));

    case "ADD_DAY": {
      if (state.days.length >= ITINERARY_LIMITS.maxDays) return state;
      return { ...state, days: [...state.days, createEmptyDay(action.id, state.days.length + 1)] };
    }

    case "REMOVE_DAY": {
      if (state.days.length <= 1) return state;
      return { ...state, days: renumberDays(state.days.filter((day) => day.id !== action.dayId)) };
    }

    case "MOVE_DAY": {
      return { ...state, days: renumberDays(moveItem(state.days, action.dayId, action.direction)) };
    }

    case "SET_DAY_IMAGE":
      return updateDay(state, action.dayIndex, (day) => ({ ...day, image: action.image }));

    default:
      return state;
  }
}
