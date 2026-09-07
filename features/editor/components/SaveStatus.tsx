import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutosaveStatus } from "@/hooks/useAutosave";

export function SaveStatus({
  status,
  error,
  onRetry,
}: {
  status: AutosaveStatus;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Guardando…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
        <CircleAlert className="size-3.5 shrink-0" aria-hidden />
        {error ?? "No se pudo guardar."}
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onRetry}>
          Reintentar
        </Button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
      <CircleCheck className="size-3.5 shrink-0 text-primary" aria-hidden /> Todos los cambios guardados.
    </span>
  );
}
