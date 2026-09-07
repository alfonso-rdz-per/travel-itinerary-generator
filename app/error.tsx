"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Boundary de error de la aplicación (Next.js App Router): captura
 * excepciones no controladas de cualquier Server/Client Component bajo
 * `app/` y muestra un mensaje genérico — nunca el error técnico ni el stack
 * trace, tal como exige PROJECT_SPEC.md sección 14/15 ("nunca mostrar
 * errores técnicos"). El detalle real solo se registra en el servidor.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-semibold text-foreground">Ocurrió un problema inesperado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          No pudimos completar esta acción. Intenta de nuevo en unos segundos; si el problema continúa,
          contacta al equipo técnico.
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        Intentar de nuevo
      </Button>
    </div>
  );
}
