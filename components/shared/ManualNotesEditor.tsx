"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type ManualNoteRow = { id: string; title: string; body: string };

/**
 * "Agregar Datos": bloque opcional de texto libre por día que agrega ÚNICAMENTE
 * el agente (la IA nunca lo ve ni lo modifica). Cada dato tiene un título
 * (etiqueta que sale en negritas en el PDF, ej. "Vuelos") y un cuerpo con la
 * información. Se usa igual en el formulario y en el editor.
 */
export function ManualNotesEditor({
  notes,
  idPrefix,
  disabled,
  maxNotes,
  onAdd,
  onUpdate,
  onRemove,
}: {
  notes: ManualNoteRow[];
  idPrefix: string;
  disabled?: boolean;
  maxNotes: number;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Pick<ManualNoteRow, "title" | "body">>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {notes.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          {notes.map((note, index) => (
            <div key={note.id} className="flex flex-col gap-2">
              {index > 0 && <div className="border-t border-border" />}
              <div className="flex items-start gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`${idPrefix}-title-${index}`} className="text-xs text-muted-foreground">
                      Título
                    </Label>
                    <Input
                      id={`${idPrefix}-title-${index}`}
                      value={note.title}
                      onChange={(event) => onUpdate(note.id, { title: event.target.value })}
                      aria-label={`Título del dato ${index + 1}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`${idPrefix}-body-${index}`} className="text-xs text-muted-foreground">
                      Información
                    </Label>
                    <Textarea
                      id={`${idPrefix}-body-${index}`}
                      value={note.body}
                      onChange={(event) => onUpdate(note.id, { body: event.target.value })}
                      rows={2}
                      aria-label={`Información del dato ${index + 1}`}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(note.id)}
                  aria-label={`Eliminar dato ${index + 1}`}
                  className="mt-5 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={onAdd}
        disabled={disabled || notes.length >= maxNotes}
        title={notes.length >= maxNotes ? `Máximo ${maxNotes} datos por día` : undefined}
      >
        <Plus /> Agregar Datos
      </Button>
    </div>
  );
}
