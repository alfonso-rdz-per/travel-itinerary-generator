"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarRange, Copy, Download, Loader2, MapPin, Pencil, Trash2, Users, Wallet } from "lucide-react";
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
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { formatDate, formatDateRange } from "@/utils/formatDate";
import { deleteProposal, duplicateProposal } from "../actions";
import { formatMoney } from "../money";
import type { ProposalListItem } from "../types";

export function ProposalCard({
  proposal,
  onDeleted,
}: {
  proposal: ProposalListItem;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();
  const [isDuplicating, startDuplicating] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isReady = proposal.status === "ready";
  const dateLabel =
    proposal.startDate && proposal.endDate
      ? formatDateRange(proposal.startDate, proposal.endDate)
      : proposal.startDate
        ? formatDate(proposal.startDate)
        : "Sin fechas";

  function handleDelete() {
    setError(null);
    startDeleting(async () => {
      const result = await deleteProposal(proposal.id);
      if (result.success) {
        setDialogOpen(false);
        onDeleted(proposal.id);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDuplicate() {
    setError(null);
    startDuplicating(async () => {
      const result = await duplicateProposal(proposal.id);
      if (!result.success) setError(result.error);
      // en éxito, la Server Action redirige a la copia
    });
  }

  const pill = "flex-1 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary";

  return (
    <Card className="shadow-sm ring-0 transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              <Link href={`/proposals/${proposal.id}`} className="hover:underline">
                {proposal.clientName}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1.5 flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{proposal.destination}</span>
            </CardDescription>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-sm text-foreground/80">
          <div className="flex items-center gap-1.5">
            <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span>{dateLabel}</span>
          </div>
          {proposal.numTravelers && proposal.numTravelers > 0 ? (
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                {proposal.numTravelers} {proposal.numTravelers === 1 ? "viajero" : "viajeros"}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-1.5">
            <Wallet className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {proposal.total > 0 ? (
              <span className="font-semibold text-foreground">
                {formatMoney(proposal.total, proposal.currency)}
              </span>
            ) : (
              <span className="text-muted-foreground">Sin precio</span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Actualizada el {formatDate(proposal.updatedAt)}</p>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className={pill}
            nativeButton={false}
            render={<Link href={`/proposals/${proposal.id}/edit`} />}
          >
            <Pencil /> Editar
          </Button>
          {isReady ? (
            <Button
              variant="outline"
              size="sm"
              className={pill}
              nativeButton={false}
              render={<a href={`/api/proposals/${proposal.id}/pdf`} target="_blank" rel="noopener noreferrer" />}
            >
              <Download /> PDF
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full"
              disabled
              title="Disponible cuando la propuesta esté lista"
            >
              <Download /> PDF
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={pill}
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            {isDuplicating ? <Loader2 className="animate-spin" /> : <Copy />} Duplicar
          </Button>
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
                <AlertDialogTitle>¿Eliminar esta propuesta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará permanentemente la propuesta de <strong>{proposal.clientName}</strong> (
                  {proposal.destination}). Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
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
