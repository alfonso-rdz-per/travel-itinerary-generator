"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ItineraryStatus } from "@/types/database";
import type { ProposalImage } from "@/types/proposal";
import { regenerateProposalText } from "../actions";
import type { ProposalView } from "../present";
import { ProposalImageCard } from "./ProposalImageCard";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#444197]">{children}</h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm text-foreground/90">
          <span className="text-[#444197]">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProposalPreview({
  proposalId,
  status,
  view,
  image,
  hasGenerated,
  textIsStale = false,
}: {
  proposalId: string;
  status: ItineraryStatus;
  view: ProposalView;
  image: ProposalImage | null;
  hasGenerated: boolean;
  textIsStale?: boolean;
}) {
  const router = useRouter();
  const [isRegenerating, startRegenerating] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRegenerate() {
    setError(null);
    startRegenerating(async () => {
      const result = await regenerateProposalText(proposalId);
      if (result.success) router.refresh();
      else setError(result.error);
    });
  }

  const unsplash = image && image.source === "unsplash" ? image : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 pb-16 lg:p-8">
      {/* Barra de acciones */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-sm lg:-mx-8 lg:px-8">
        <Link
          href="/proposals"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Volver a propuestas
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Previsualización</h1>
            <p className="text-sm text-muted-foreground">
              Revisa la propuesta antes de descargarla. Puedes editarla o regenerar el texto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/proposals/${proposalId}/edit`} />}
            >
              <Pencil /> Editar propuesta
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? <Loader2 className="animate-spin" /> : <RefreshCw />} Regenerar texto
            </Button>
            {hasGenerated ? (
              <Button
                variant="gold"
                size="sm"
                nativeButton={false}
                render={<a href={`/api/proposals/${proposalId}/pdf`} target="_blank" rel="noopener noreferrer" />}
              >
                <Download /> Descargar propuesta
              </Button>
            ) : (
              <Button variant="gold" size="sm" disabled>
                <Download /> Descargar propuesta
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>
            La última generación falló. Puedes intentar “Regenerar texto” o editar la propuesta.
          </AlertDescription>
        </Alert>
      )}

      {status === "generating" && (
        <Alert>
          <AlertDescription>Generando la propuesta… recarga en unos segundos.</AlertDescription>
        </Alert>
      )}

      {!hasGenerated && status !== "generating" && status !== "error" && (
        <Alert>
          <AlertDescription>
            Esta propuesta aún no tiene texto generado. Usa “Regenerar texto” o edítala y vuelve a generar.
          </AlertDescription>
        </Alert>
      )}

      {textIsStale && hasGenerated && status === "ready" && (
        <Alert>
          <AlertDescription>
            Editaste los datos después de generar el texto. Los precios y datos ya están actualizados; usa
            “Regenerar texto” si quieres que la redacción también refleje los cambios.
          </AlertDescription>
        </Alert>
      )}

      {hasGenerated && <ProposalImageCard proposalId={proposalId} image={image} />}

      {/* Documento */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Portada */}
        <div className="relative flex flex-col items-center justify-center gap-3 bg-[#444197] px-8 py-16 text-center text-white">
          <div className="flex size-14 items-center justify-center rounded-full border border-white/40 text-lg font-semibold tracking-wide">
            VS
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Wander Travel</p>
          <p className="text-2xl font-light tracking-wide">Propuesta de Viaje</p>
          <div className="my-2 h-px w-12 bg-white/40" />
          <p className="text-xl font-semibold">{view.clientName}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/90">{view.destination}</p>
          {view.dateLabel && <p className="text-sm text-white/80">{view.dateLabel}</p>}
        </div>

        <div className="flex flex-col gap-8 p-6 lg:p-10">
          {view.presentation && (
            <section className="flex flex-col gap-2">
              <SectionTitle>Presentación</SectionTitle>
              <p className="text-sm leading-relaxed text-foreground/90">{view.presentation}</p>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionTitle>Tu viaje</SectionTitle>
            {unsplash && (
              <figure className="flex flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={unsplash.urls.regular}
                  alt={view.destination}
                  className="h-56 w-full rounded-lg object-cover"
                />
                <figcaption className="text-[10px] text-muted-foreground">
                  Fotografía:{" "}
                  <a href={unsplash.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {unsplash.photographer}
                  </a>{" "}
                  — Unsplash
                </figcaption>
              </figure>
            )}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {view.tripFacts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-0.5">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{fact.label}</dt>
                  <dd className="text-sm font-semibold text-foreground">{fact.value}</dd>
                </div>
              ))}
            </dl>
            {view.tripOverview && (
              <p className="text-sm leading-relaxed text-foreground/90">{view.tripOverview}</p>
            )}
          </section>

          {view.services.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Experiencias y servicios</SectionTitle>
              <div className="flex flex-col divide-y divide-border">
                {view.services.map((service, index) => {
                  const meta = [service.dayLabel, service.place].filter(Boolean).join("  ·  ");
                  return (
                    <div key={index} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-foreground">{service.name}</p>
                        {service.priceLabel && (
                          <p className="shrink-0 text-sm font-bold text-[#444197]">{service.priceLabel}</p>
                        )}
                      </div>
                      {meta && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{meta}</p>}
                      {service.description && (
                        <p className="text-sm leading-relaxed text-foreground/80">{service.description}</p>
                      )}
                      {service.note && <p className="text-xs text-muted-foreground">{service.note}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionTitle>Inversión</SectionTitle>
            <div className="flex items-center justify-between rounded-lg border border-[#444197] px-5 py-4">
              <span className="text-sm font-bold uppercase tracking-wide">Total de la propuesta</span>
              <span className="text-lg font-bold text-[#444197]">{view.totalLabel}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Precios en {view.currency}. Sujetos a disponibilidad al momento de la reserva.
            </p>
          </section>

          {view.included.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionTitle>Incluye</SectionTitle>
              <BulletList items={view.included} />
            </section>
          )}

          {view.notIncluded.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionTitle>No incluye</SectionTitle>
              <BulletList items={view.notIncluded} />
            </section>
          )}

          {view.notes.trim() && (
            <section className="flex flex-col gap-2">
              <SectionTitle>Notas importantes</SectionTitle>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{view.notes}</p>
            </section>
          )}

          {view.closing && (
            <section className="flex flex-col gap-2 border-t border-[#444197] pt-4">
              <p className="text-sm italic leading-relaxed text-foreground/90">{view.closing}</p>
              <p className="text-sm font-bold text-[#444197]">Wander Travel</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
