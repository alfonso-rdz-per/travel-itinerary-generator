"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarRange, Download, Loader2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate, formatDateRange } from "@/utils/formatDate";
import { deleteItinerary } from "../actions";
import type { DashboardItinerary } from "../types";
import { StatusBadge } from "./StatusBadge";

export function ItineraryCard({
  itinerary,
  onDeleted,
}: {
  itinerary: DashboardItinerary;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isReady = itinerary.status === "ready";

  function handleConfirmDelete() {
    setDeleteError(null);
    startDeleting(async () => {
      const result = await deleteItinerary(itinerary.id);
      if (result.success) {
        setDialogOpen(false);
        onDeleted(itinerary.id);
        router.refresh();
      } else {
        setDeleteError(result.error);
      }
    });
  }

  return (
    <Card className="shadow-sm ring-0 transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{itinerary.passengerName}</CardTitle>
            <CardDescription className="mt-1.5 flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{itinerary.destination}</span>
            </CardDescription>
          </div>
          <StatusBadge status={itinerary.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-sm text-foreground/80">
          <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span>{formatDateRange(itinerary.startDate, itinerary.endDate)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Actualizado el {formatDate(itinerary.updatedAt)}
        </p>

        {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

        <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
          {/* Editar siempre disponible: un draft/error/generating abre el
              formulario retomable (con lo ya capturado); un ready abre el
              editor con IA. Nunca es un callejón sin salida (ver Fase 10). */}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
            nativeButton={false}
            render={<Link href={`/itineraries/${itinerary.id}/edit`} />}
          >
            <Pencil /> Editar
          </Button>
          {isReady ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
              nativeButton={false}
              render={<a href={`/api/itineraries/${itinerary.id}/pdf`} target="_blank" rel="noopener noreferrer" />}
            >
              <Download /> PDF
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full"
              disabled
              title="Disponible cuando el itinerario esté listo"
            >
              <Download /> PDF
            </Button>
          )}
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                />
              }
            >
              <Trash2 /> Eliminar
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este itinerario?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará permanentemente el itinerario de <strong>{itinerary.passengerName}</strong> (
                  {itinerary.destination}). Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <Button variant="destructive" disabled={isDeleting} onClick={handleConfirmDelete}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin" /> Eliminando…
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
