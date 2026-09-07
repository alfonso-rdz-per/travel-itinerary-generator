"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAutosave } from "@/hooks/useAutosave";
import type { EnrichedItinerary } from "@/types/itinerary";
import { ITINERARY_LIMITS } from "@/types/itinerary";
import { updateItineraryContent } from "../actions";
import { useEditorState } from "../hooks/useEditorState";
import { toEditorSavePayload } from "../lib/convert";
import { DayEditorCard } from "./DayEditorCard";
import { EditorHeader } from "./EditorHeader";
import { OverviewCard } from "./OverviewCard";

export function EditorContent({
  itineraryId,
  initialGenerated,
  passengerName,
  destination,
  startDate,
  endDate,
}: {
  itineraryId: string;
  initialGenerated: EnrichedItinerary;
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
}) {
  const { state, actions } = useEditorState(initialGenerated);

  const [expandedDays, setExpandedDays] = useState<ReadonlySet<string>>(
    () => new Set(state.days.map((day) => day.id)),
  );

  const toggleDay = useCallback((dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }, []);

  // Evento real (click), no un efecto: agrega el día y lo deja expandido en
  // el mismo gesto del usuario, sin necesitar un useEffect para sincronizar
  // el nuevo id con el Set de expandidos.
  function handleAddDay() {
    const id = crypto.randomUUID();
    actions.addDay(id);
    setExpandedDays((prev) => new Set(prev).add(id));
  }

  // Solo cambia cuando el contenido editable realmente cambia (no al
  // expandir/contraer días) — así el autoguardado nunca dispara de más.
  const savePayload = useMemo(() => toEditorSavePayload(state), [state]);

  const save = useCallback(
    (payload: typeof savePayload) => updateItineraryContent(itineraryId, payload.content, payload.dayOrigins),
    [itineraryId],
  );

  const { status, error, retry } = useAutosave(savePayload, save);

  const canRemoveDay = state.days.length > 1;
  const atMaxDays = state.days.length >= ITINERARY_LIMITS.maxDays;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-16 lg:p-8">
      <EditorHeader
        itineraryId={itineraryId}
        passengerName={passengerName}
        destination={destination}
        startDate={startDate}
        endDate={endDate}
        status={status}
        error={error}
        onRetry={retry}
      />

      <OverviewCard overview={state.overview} onChange={actions.updateOverview} />

      <div className="flex flex-col gap-4">
        {state.days.map((day, index) => (
          <DayEditorCard
            key={day.id}
            itineraryId={itineraryId}
            dayIndex={index}
            day={day}
            isExpanded={expandedDays.has(day.id)}
            onToggle={toggleDay}
            canMoveUp={index > 0}
            canMoveDown={index < state.days.length - 1}
            canRemove={canRemoveDay}
            actions={actions}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={handleAddDay}
          disabled={atMaxDays}
          title={atMaxDays ? `Un itinerario no puede tener más de ${ITINERARY_LIMITS.maxDays} días.` : undefined}
        >
          <Plus /> Agregar día
        </Button>
      </div>
    </div>
  );
}
