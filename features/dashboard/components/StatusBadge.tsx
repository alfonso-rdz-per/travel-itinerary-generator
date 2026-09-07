import { Badge } from "@/components/ui/badge";
import type { ItineraryStatus } from "@/types/database";

const STATUS_CONFIG: Record<
  ItineraryStatus,
  { label: string; variant: "outline" | "secondary" | "success" | "destructive" }
> = {
  draft: { label: "Borrador", variant: "outline" },
  generating: { label: "Generando", variant: "secondary" },
  ready: { label: "Listo", variant: "success" },
  error: { label: "Error", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ItineraryStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className="gap-1.5">
      {status === "generating" && (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
      )}
      {config.label}
    </Badge>
  );
}
