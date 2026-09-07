import Link from "next/link";
import { ArrowLeft, CalendarRange, Download, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/utils/formatDate";
import type { AutosaveStatus } from "@/hooks/useAutosave";
import { SaveStatus } from "./SaveStatus";

export function EditorHeader({
  itineraryId,
  passengerName,
  destination,
  startDate,
  endDate,
  status,
  error,
  onRetry,
}: {
  itineraryId: string;
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: AutosaveStatus;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-sm lg:-mx-8 lg:px-8">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Volver a itinerarios
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{passengerName}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden /> {destination}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarRange className="size-3.5 shrink-0" aria-hidden /> {formatDateRange(startDate, endDate)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatus status={status} error={error} onRetry={onRetry} />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a href={`/api/itineraries/${itineraryId}/pdf`} target="_blank" rel="noopener noreferrer" />
            }
          >
            <Download /> Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
