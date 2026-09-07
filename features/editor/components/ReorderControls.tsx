import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botones de subir/bajar/eliminar reutilizados por actividades, recomendaciones y consejos. */
export function ReorderControls({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  removeLabel = "Eliminar",
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  removeLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!canMoveUp}
        onClick={onMoveUp}
        title="Subir"
        aria-label="Subir"
      >
        <ArrowUp className="text-muted-foreground" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!canMoveDown}
        onClick={onMoveDown}
        title="Bajar"
        aria-label="Bajar"
      >
        <ArrowDown className="text-muted-foreground" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} title={removeLabel} aria-label={removeLabel}>
        <Trash2 className="text-muted-foreground" />
      </Button>
    </div>
  );
}
