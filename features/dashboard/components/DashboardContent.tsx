"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchItineraries } from "../actions";
import type { DashboardItinerary } from "../types";
import { ItineraryCard } from "./ItineraryCard";
import { EmptyState } from "./EmptyState";

export function DashboardContent({ itineraries: initialItineraries }: { itineraries: DashboardItinerary[] }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [results, setResults] = useState(initialItineraries);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, startSearching] = useTransition();

  // Limpiar la búsqueda es instantáneo (evento real, no efecto): no tiene
  // sentido esperar el debounce solo para volver a la lista ya cargada.
  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults(initialItineraries);
      setSearchError(null);
    }
  }

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return;

    startSearching(async () => {
      const result = await searchItineraries(trimmed);
      if (result.success) {
        setResults(result.itineraries);
        setSearchError(null);
      } else {
        setSearchError(result.error);
      }
    });
  }, [debouncedQuery]);

  function handleDeleted(id: string) {
    setResults((prev) => prev.filter((itinerary) => itinerary.id !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Itinerarios</h1>
        <p className="text-sm text-muted-foreground">
          {initialItineraries.length}{" "}
          {initialItineraries.length === 1 ? "itinerario creado" : "itinerarios creados"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Buscar…"
            className="pl-9"
            aria-label="Buscar itinerarios"
          />
          {isSearching && (
            <Loader2
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
        <Button
          variant="gold"
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href="/itineraries/new" />}
        >
          <Plus /> Nuevo Itinerario
        </Button>
      </div>

      {searchError && (
        <Alert variant="destructive">
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {initialItineraries.length === 0 ? (
        <EmptyState variant="no-data" />
      ) : results.length === 0 && !isSearching ? (
        <EmptyState variant="no-results" searchQuery={query} onClearSearch={() => handleQueryChange("")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((itinerary) => (
            <ItineraryCard key={itinerary.id} itinerary={itinerary} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
