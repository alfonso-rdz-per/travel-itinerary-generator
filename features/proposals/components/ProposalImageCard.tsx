"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, CircleAlert, CircleCheck, Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ProposalImage } from "@/types/proposal";
import {
  removeProposalImage,
  searchProposalImages,
  selectProposalImage,
  type ImageSearchResult,
} from "../imageActions";

type LocalStatus = "idle" | "saving" | "saved" | "error";

/**
 * Selector manual de la imagen de destino de la propuesta — mismo patrón que
 * el DayImageCard del editor de itinerarios (buscar en Unsplash, elegir una
 * foto, o quitar la imagen). Reutiliza features/proposals/imageActions.ts.
 */
export function ProposalImageCard({
  proposalId,
  image,
}: {
  proposalId: string;
  image: ProposalImage | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageSearchResult[] | null>(null);
  const [status, setStatus] = useState<LocalStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearching] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const unsplash = image && image.source === "unsplash" ? image : null;
  const canRemove = !!unsplash;
  const canSearch = query.trim().length > 0;

  function handleSearch() {
    if (!canSearch) return;
    setError(null);
    setResults(null);
    startSearching(async () => {
      const result = await searchProposalImages(proposalId, query);
      if (result.success) setResults(result.results);
      else setError(result.error);
    });
  }

  function handleSelect(candidate: ImageSearchResult) {
    setError(null);
    setStatus("saving");
    startSaving(async () => {
      const result = await selectProposalImage(proposalId, candidate.id, query);
      if (result.success) {
        setResults(null);
        setQuery("");
        setStatus("saved");
        router.refresh();
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  function handleRemove() {
    setError(null);
    setStatus("saving");
    startSaving(async () => {
      const result = await removeProposalImage(proposalId);
      if (result.success) {
        setStatus("saved");
        router.refresh();
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <Card className="shadow-sm ring-0">
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">Imagen de la propuesta</h2>
          <p className="text-xs text-muted-foreground">
            Se muestra en la sección “Tu viaje” del documento y del PDF.
          </p>
        </div>

        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted">
          {unsplash ? (
            <Image
              src={unsplash.urls.regular}
              alt=""
              fill
              sizes="(min-width: 1024px) 440px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera className="size-8" aria-hidden />
            </div>
          )}
        </div>

        {unsplash ? (
          <a
            href={unsplash.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Foto de {unsplash.photographer} en Unsplash
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">
            {image?.source === "none" ? "Sin imagen (eliminada)." : "Sin imagen."}
          </span>
        )}

        <div className="flex flex-col gap-1.5">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Cambiar imagen…"
            aria-label="Buscar imagen"
            className="max-w-md"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSearch}
              disabled={!canSearch || isSearching}
            >
              {isSearching ? <Loader2 className="animate-spin" /> : <Search />} Buscar imagen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleRemove}
              disabled={!canRemove || isSaving}
              title={canRemove ? "Quitar imagen" : "No hay una imagen que quitar"}
            >
              <Trash2 /> Quitar imagen
            </Button>

            {status === "saving" && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
                <Loader2 className="size-3.5 animate-spin" aria-hidden /> Guardando…
              </span>
            )}
            {status === "saved" && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
                <CircleCheck className="size-3.5 shrink-0 text-primary" aria-hidden /> Imagen guardada.
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden /> {error}
          </p>
        )}

        {results && (
          <div className="flex flex-col gap-1.5">
            {results.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin resultados para esa búsqueda.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {results.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => handleSelect(candidate)}
                    disabled={isSaving}
                    className="relative aspect-video overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                    title={`Fotografía de ${candidate.photographer}`}
                  >
                    <Image src={candidate.thumbUrl} alt="" fill sizes="150px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
