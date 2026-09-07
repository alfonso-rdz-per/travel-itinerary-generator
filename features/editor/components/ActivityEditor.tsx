import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EditorActions } from "../hooks/useEditorState";
import type { EditableActivity } from "../types";
import { ReorderControls } from "./ReorderControls";

type Props = {
  dayIndex: number;
  activity: EditableActivity;
  index: number;
  total: number;
  actions: EditorActions;
};

/**
 * Recibe `actions` (identidad estable) en vez de callbacks ya atados: así el
 * memo compara solo `activity` (cambia únicamente para la actividad editada)
 * y no se re-renderiza por ediciones en otras partes del mismo día.
 */
function ActivityEditorComponent({ dayIndex, activity, index, total, actions }: Props) {
  // dayIndex/index (posición, determinista) — nunca activity.id (aleatorio):
  // usarlo en un atributo `id` del DOM causaría un hydration mismatch, ya
  // que el servidor y el cliente generan valores distintos con crypto.randomUUID().
  const fieldId = `activity-${dayIndex}-${index}`;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="pt-1.5 text-xs font-medium text-muted-foreground">Actividad {index + 1}</span>
        <ReorderControls
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onMoveUp={() => actions.moveActivity(dayIndex, activity.id, "up")}
          onMoveDown={() => actions.moveActivity(dayIndex, activity.id, "down")}
          onRemove={() => actions.removeActivity(dayIndex, activity.id)}
          removeLabel="Eliminar actividad"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${fieldId}-place`} className="text-xs text-muted-foreground">
            Lugar
          </Label>
          <Input
            id={`${fieldId}-place`}
            value={activity.place}
            onChange={(event) => actions.updateActivity(dayIndex, activity.id, { place: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${fieldId}-activity`} className="text-xs text-muted-foreground">
            Actividad
          </Label>
          <Input
            id={`${fieldId}-activity`}
            value={activity.activity}
            onChange={(event) => actions.updateActivity(dayIndex, activity.id, { activity: event.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${fieldId}-description`} className="text-xs text-muted-foreground">
          Descripción
        </Label>
        <Textarea
          id={`${fieldId}-description`}
          value={activity.description}
          onChange={(event) => actions.updateActivity(dayIndex, activity.id, { description: event.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}

export const ActivityEditor = memo(ActivityEditorComponent);
