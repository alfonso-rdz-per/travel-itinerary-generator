import { memo } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ManualNotesEditor } from "@/components/shared/ManualNotesEditor";
import { ITINERARY_LIMITS } from "@/types/itinerary";
import type { EditorActions } from "../hooks/useEditorState";
import type { EditableDay } from "../types";
import { ActivityEditor } from "./ActivityEditor";
import { DayImageCard } from "./DayImageCard";
import { ReorderControls } from "./ReorderControls";
import { StringListEditor } from "./StringListEditor";

type Props = {
  itineraryId: string;
  dayIndex: number;
  day: EditableDay;
  isExpanded: boolean;
  onToggle: (dayId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  actions: EditorActions;
};

/**
 * Memoizado: mientras `day` conserve la misma referencia (ningún campo de
 * este día cambió), no se vuelve a renderizar aunque otros días o el resumen
 * general sí cambien. Reordenar/agregar/eliminar días usa los mismos botones
 * subir/bajar/eliminar que actividades y listas (`ReorderControls`) — sin
 * drag & drop, igual que el resto del editor (Fase 7).
 */
function DayEditorCardComponent({
  itineraryId,
  dayIndex,
  day,
  isExpanded,
  onToggle,
  canMoveUp,
  canMoveDown,
  canRemove,
  actions,
}: Props) {
  return (
    <Card className="shadow-sm ring-0">
      <CardHeader
        className="cursor-pointer flex-row items-center justify-between gap-3 space-y-0"
        onClick={() => onToggle(day.id)}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <CardTitle className="text-base">Día {day.day}</CardTitle>
          {!isExpanded && <p className="truncate text-sm text-muted-foreground">{day.title}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
          {canRemove && (
            <ReorderControls
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={() => actions.moveDay(day.id, "up")}
              onMoveDown={() => actions.moveDay(day.id, "down")}
              onRemove={() => actions.removeDay(day.id)}
              removeLabel="Eliminar día"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggle(day.id)}
            aria-label={isExpanded ? "Contraer día" : "Expandir día"}
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="flex flex-col gap-5">
          <DayImageCard
            itineraryId={itineraryId}
            dayIndex={dayIndex}
            image={day.image}
            onImageChange={(image) => actions.setDayImage(dayIndex, image)}
          />

          <div className="flex flex-col gap-1.5">
            {/* dayIndex, no day.id: id/htmlFor van al DOM, y day.id se genera
                con crypto.randomUUID() de forma independiente en servidor y
                cliente — usarlo aquí causa un hydration mismatch (mismo
                motivo por el que ActivityEditor ya usa dayIndex+posición). */}
            <Label htmlFor={`day-title-${dayIndex}`}>Título del día</Label>
            <Input
              id={`day-title-${dayIndex}`}
              value={day.title}
              onChange={(event) => actions.updateDay(dayIndex, { title: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`day-introduction-${dayIndex}`}>Introducción</Label>
            <Textarea
              id={`day-introduction-${dayIndex}`}
              value={day.introduction}
              onChange={(event) => actions.updateDay(dayIndex, { introduction: event.target.value })}
              rows={3}
            />
          </div>

          <ManualNotesEditor
            notes={day.manualNotes}
            idPrefix={`editor-day-${dayIndex}-note`}
            maxNotes={ITINERARY_LIMITS.maxManualNotes}
            onAdd={() => actions.addManualNote(dayIndex)}
            onUpdate={(noteId, patch) => actions.updateManualNote(dayIndex, noteId, patch)}
            onRemove={(noteId) => actions.removeManualNote(dayIndex, noteId)}
          />

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Actividades</Label>
            <div className="flex flex-col gap-2">
              {day.activities.map((activity, index) => (
                <ActivityEditor
                  key={activity.id}
                  dayIndex={dayIndex}
                  activity={activity}
                  index={index}
                  total={day.activities.length}
                  actions={actions}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit text-muted-foreground hover:text-foreground"
              onClick={() => actions.addActivity(dayIndex)}
            >
              <Plus /> Agregar actividad
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Recomendaciones</Label>
            <StringListEditor
              dayIndex={dayIndex}
              listKey="recommendations"
              items={day.recommendations}
              actions={actions}
              addLabel="Agregar recomendación"
              emptyLabel="Sin recomendaciones todavía."
              itemLabel="Recomendación"
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Consejos</Label>
            <StringListEditor
              dayIndex={dayIndex}
              listKey="tips"
              items={day.tips}
              actions={actions}
              addLabel="Agregar consejo"
              emptyLabel="Sin consejos todavía."
              itemLabel="Consejo"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export const DayEditorCard = memo(DayEditorCardComponent);
