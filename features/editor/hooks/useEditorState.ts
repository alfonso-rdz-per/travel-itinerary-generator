"use client";

import { useMemo, useReducer } from "react";
import type { GeminiOverview, EnrichedItinerary, ItineraryDayImage } from "@/types/itinerary";
import { toEditableItinerary } from "../lib/convert";
import { editorReducer } from "../state/editorReducer";
import type { EditableListKey } from "../types";

type Direction = "up" | "down";

/**
 * Estado del editor + acciones con identidad estable (envuelven `dispatch`,
 * que React garantiza estable). Permite que los componentes hijos se
 * memoicen de verdad: recibir las mismas funciones en cada render evita que
 * cambiar un día/actividad vuelva a renderizar los demás.
 */
export function useEditorState(initial: EnrichedItinerary) {
  const [state, dispatch] = useReducer(editorReducer, initial, toEditableItinerary);

  const actions = useMemo(
    () => ({
      updateOverview: (patch: Partial<GeminiOverview>) => dispatch({ type: "UPDATE_OVERVIEW", patch }),

      updateDay: (dayIndex: number, patch: Partial<{ title: string; introduction: string }>) =>
        dispatch({ type: "UPDATE_DAY", dayIndex, patch }),

      updateActivity: (
        dayIndex: number,
        activityId: string,
        patch: Partial<{ place: string; activity: string; description: string }>,
      ) => dispatch({ type: "UPDATE_ACTIVITY", dayIndex, activityId, patch }),

      addActivity: (dayIndex: number) => dispatch({ type: "ADD_ACTIVITY", dayIndex }),

      removeActivity: (dayIndex: number, activityId: string) =>
        dispatch({ type: "REMOVE_ACTIVITY", dayIndex, activityId }),

      moveActivity: (dayIndex: number, activityId: string, direction: Direction) =>
        dispatch({ type: "MOVE_ACTIVITY", dayIndex, activityId, direction }),

      updateListItem: (dayIndex: number, listKey: EditableListKey, itemId: string, value: string) =>
        dispatch({ type: "UPDATE_LIST_ITEM", dayIndex, listKey, itemId, value }),

      addListItem: (dayIndex: number, listKey: EditableListKey) =>
        dispatch({ type: "ADD_LIST_ITEM", dayIndex, listKey }),

      removeListItem: (dayIndex: number, listKey: EditableListKey, itemId: string) =>
        dispatch({ type: "REMOVE_LIST_ITEM", dayIndex, listKey, itemId }),

      moveListItem: (dayIndex: number, listKey: EditableListKey, itemId: string, direction: Direction) =>
        dispatch({ type: "MOVE_LIST_ITEM", dayIndex, listKey, itemId, direction }),

      addManualNote: (dayIndex: number) => dispatch({ type: "ADD_MANUAL_NOTE", dayIndex }),

      removeManualNote: (dayIndex: number, noteId: string) =>
        dispatch({ type: "REMOVE_MANUAL_NOTE", dayIndex, noteId }),

      updateManualNote: (dayIndex: number, noteId: string, patch: Partial<{ title: string; body: string }>) =>
        dispatch({ type: "UPDATE_MANUAL_NOTE", dayIndex, noteId, patch }),

      addDay: (id: string) => dispatch({ type: "ADD_DAY", id }),

      removeDay: (dayId: string) => dispatch({ type: "REMOVE_DAY", dayId }),

      moveDay: (dayId: string, direction: Direction) => dispatch({ type: "MOVE_DAY", dayId, direction }),

      setDayImage: (dayIndex: number, image: ItineraryDayImage) =>
        dispatch({ type: "SET_DAY_IMAGE", dayIndex, image }),
    }),
    [],
  );

  return { state, actions };
}

export type EditorActions = ReturnType<typeof useEditorState>["actions"];
