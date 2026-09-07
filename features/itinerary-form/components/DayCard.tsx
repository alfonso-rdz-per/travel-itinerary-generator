"use client";

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManualNotesEditor } from "@/components/shared/ManualNotesEditor";
import { ITINERARY_LIMITS } from "@/types/itinerary";
import { DayEntryRow } from "./DayEntryRow";
import type { DayField } from "../hooks/useItineraryDays";

interface DayCardProps {
  day: DayField;
  dayNumber: number;
  canRemoveDay: boolean;
  isLeaving: boolean;
  leavingEntryIds: ReadonlySet<string>;
  focusEntryId: string | null;
  onClearFocusRequest: () => void;
  registerPlaceInput: (id: string, el: HTMLInputElement | null) => void;
  focusEntry: (id: string) => void;
  onRemoveDay: () => void;
  onAddEntry: () => void;
  onRemoveEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, patch: { place?: string; activity?: string }) => void;
  onAddManualNote: () => void;
  onRemoveManualNote: (noteId: string) => void;
  onUpdateManualNote: (noteId: string, patch: { title?: string; body?: string }) => void;
}

export function DayCard({
  day,
  dayNumber,
  canRemoveDay,
  isLeaving,
  leavingEntryIds,
  focusEntryId,
  onClearFocusRequest,
  registerPlaceInput,
  focusEntry,
  onRemoveDay,
  onAddEntry,
  onRemoveEntry,
  onUpdateEntry,
  onAddManualNote,
  onRemoveManualNote,
  onUpdateManualNote,
}: DayCardProps) {
  return (
    <Card
      className={
        isLeaving
          ? "shadow-sm ring-0 animate-out fade-out slide-out-to-left-2 duration-150"
          : "shadow-sm ring-0 animate-in fade-in slide-in-from-top-2 duration-200"
      }
    >
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Día {dayNumber}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemoveDay}
          disabled={!canRemoveDay}
          title={canRemoveDay ? "Eliminar día" : "Debe existir al menos un día"}
          aria-label="Eliminar día"
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {day.entries.map((entry, index) => (
          <DayEntryRow
            key={entry.id}
            entry={entry}
            index={index}
            isOnlyEntry={day.entries.length === 1}
            isLeaving={leavingEntryIds.has(entry.id)}
            autoFocus={focusEntryId === entry.id}
            onFocused={onClearFocusRequest}
            registerPlaceRef={registerPlaceInput}
            onChangePlace={(value) => onUpdateEntry(entry.id, { place: value })}
            onChangeActivity={(value) => onUpdateEntry(entry.id, { activity: value })}
            onRemove={() => {
              const previous = day.entries[index - 1];
              onRemoveEntry(entry.id);
              if (previous) focusEntry(previous.id);
            }}
            onEnter={onAddEntry}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit text-muted-foreground hover:text-foreground"
          onClick={onAddEntry}
        >
          <Plus /> Agregar lugar
        </Button>

        <div className="mt-2 border-t border-border pt-3">
          <ManualNotesEditor
            notes={day.manualNotes}
            idPrefix={`day-${dayNumber}-note`}
            maxNotes={ITINERARY_LIMITS.maxManualNotes}
            onAdd={onAddManualNote}
            onUpdate={onUpdateManualNote}
            onRemove={onRemoveManualNote}
          />
        </div>
      </CardContent>
    </Card>
  );
}
