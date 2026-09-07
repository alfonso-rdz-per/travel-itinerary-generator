"use client";

import { useCallback, useRef, useState } from "react";
import type { ManualNote } from "@/types/itinerary";

export type DayEntry = { id: string; place: string; activity: string };
export type ManualNoteField = { id: string; title: string; body: string };
export type DayField = { id: string; entries: DayEntry[]; manualNotes: ManualNoteField[] };

/** Debe coincidir con la duración de las clases animate-out usadas en DayCard/DayEntryRow. */
const EXIT_DURATION_MS = 180;

function createEntry(place = "", activity = ""): DayEntry {
  return { id: crypto.randomUUID(), place, activity };
}

function createManualNote(title = "", body = ""): ManualNoteField {
  return { id: crypto.randomUUID(), title, body };
}

function createDay(
  entries?: { place: string; activity: string }[],
  manualNotes?: ManualNote[],
): DayField {
  return {
    id: crypto.randomUUID(),
    entries: entries && entries.length > 0 ? entries.map((e) => createEntry(e.place, e.activity)) : [createEntry()],
    manualNotes: (manualNotes ?? []).map((n) => createManualNote(n.title, n.body)),
  };
}

export type InitialItineraryDay = {
  places: { place: string; activity: string }[];
  manualNotes?: ManualNote[];
};

/**
 * Estado de los días/registros (lugar + actividad) del formulario de
 * itinerario, con animaciones de salida (el elemento permanece montado un
 * instante mientras se anima) y manejo de foco para que capturar lugares se
 * sienta tan fluido como escribir una lista: Enter agrega el siguiente
 * registro, Backspace en el campo "Lugar" vacío de un registro vacío regresa
 * al anterior.
 *
 * `initialDays` (opcional): al retomar un borrador/error existente, precarga
 * los días ya capturados en vez de arrancar con un día vacío.
 */
export function useItineraryDays(initialDays?: InitialItineraryDay[]) {
  const [days, setDays] = useState<DayField[]>(() =>
    initialDays && initialDays.length > 0
      ? initialDays.map((day) => createDay(day.places, day.manualNotes))
      : [createDay()],
  );
  const [leavingDayIds, setLeavingDayIds] = useState<ReadonlySet<string>>(new Set());
  const [leavingEntryIds, setLeavingEntryIds] = useState<ReadonlySet<string>>(new Set());
  const [focusEntryId, setFocusEntryId] = useState<string | null>(null);
  const placeInputRefs = useRef(new Map<string, HTMLInputElement>());

  const registerPlaceInput = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) placeInputRefs.current.set(id, el);
    else placeInputRefs.current.delete(id);
  }, []);

  const focusEntry = useCallback((id: string) => {
    placeInputRefs.current.get(id)?.focus();
  }, []);

  const clearFocusRequest = useCallback(() => setFocusEntryId(null), []);

  const addDay = useCallback(() => {
    const day = createDay();
    setDays((prev) => [...prev, day]);
    setFocusEntryId(day.entries[0].id);
  }, []);

  const removeDay = useCallback((dayId: string) => {
    setLeavingDayIds((prev) => new Set(prev).add(dayId));
    setTimeout(() => {
      setDays((prev) => prev.filter((day) => day.id !== dayId));
      setLeavingDayIds((prev) => {
        const next = new Set(prev);
        next.delete(dayId);
        return next;
      });
    }, EXIT_DURATION_MS);
  }, []);

  const addEntry = useCallback((dayId: string) => {
    const entry = createEntry();
    setDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, entries: [...day.entries, entry] } : day)),
    );
    setFocusEntryId(entry.id);
  }, []);

  const removeEntry = useCallback((dayId: string, entryId: string) => {
    setLeavingEntryIds((prev) => new Set(prev).add(entryId));
    setTimeout(() => {
      setDays((prev) =>
        prev.map((day) =>
          day.id === dayId
            ? { ...day, entries: day.entries.filter((entry) => entry.id !== entryId) }
            : day,
        ),
      );
      setLeavingEntryIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }, EXIT_DURATION_MS);
  }, []);

  const updateEntry = useCallback(
    (dayId: string, entryId: string, patch: Partial<Pick<DayEntry, "place" | "activity">>) => {
      setDays((prev) =>
        prev.map((day) =>
          day.id === dayId
            ? {
                ...day,
                entries: day.entries.map((entry) =>
                  entry.id === entryId ? { ...entry, ...patch } : entry,
                ),
              }
            : day,
        ),
      );
    },
    [],
  );

  const addManualNote = useCallback((dayId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId ? { ...day, manualNotes: [...day.manualNotes, createManualNote()] } : day,
      ),
    );
  }, []);

  const removeManualNote = useCallback((dayId: string, noteId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? { ...day, manualNotes: day.manualNotes.filter((note) => note.id !== noteId) }
          : day,
      ),
    );
  }, []);

  const updateManualNote = useCallback(
    (dayId: string, noteId: string, patch: Partial<Pick<ManualNoteField, "title" | "body">>) => {
      setDays((prev) =>
        prev.map((day) =>
          day.id === dayId
            ? {
                ...day,
                manualNotes: day.manualNotes.map((note) =>
                  note.id === noteId ? { ...note, ...patch } : note,
                ),
              }
            : day,
        ),
      );
    },
    [],
  );

  return {
    days,
    leavingDayIds,
    leavingEntryIds,
    focusEntryId,
    clearFocusRequest,
    registerPlaceInput,
    focusEntry,
    addDay,
    removeDay,
    addEntry,
    removeEntry,
    updateEntry,
    addManualNote,
    removeManualNote,
    updateManualNote,
  };
}
