import Link from "next/link";
import { MapPinned, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps =
  | { variant: "no-data" }
  | { variant: "no-results"; searchQuery: string; onClearSearch: () => void };

export function EmptyState(props: EmptyStateProps) {
  const isNoData = props.variant === "no-data";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border px-6 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {isNoData ? (
          <MapPinned className="size-5" aria-hidden />
        ) : (
          <SearchX className="size-5" aria-hidden />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">
          {isNoData ? "Aún no tienes itinerarios" : "Sin resultados"}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {isNoData
            ? "Crea tu primer itinerario y deja que la IA se encargue de redactarlo por ti."
            : `No encontramos itinerarios que coincidan con "${props.searchQuery}".`}
        </p>
      </div>
      {isNoData ? (
        <Button variant="gold" nativeButton={false} render={<Link href="/itineraries/new" />}>
          <Plus /> Nuevo Itinerario
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={props.onClearSearch}>
          Limpiar búsqueda
        </Button>
      )}
    </div>
  );
}
