"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Loader2, Plus, Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchProposals } from "../actions";
import type { ProposalListItem } from "../types";
import { ProposalCard } from "./ProposalCard";

export function ProposalsList({ proposals: initial }: { proposals: ProposalListItem[] }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [results, setResults] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearching] = useTransition();

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults(initial);
      setError(null);
    }
  }

  useEffect(() => {
    const trimmed = debounced.trim();
    if (!trimmed) return;
    startSearching(async () => {
      const result = await searchProposals(trimmed);
      if (result.success) {
        setResults(result.proposals);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }, [debounced]);

  function handleDeleted(id: string) {
    setResults((prev) => prev.filter((proposal) => proposal.id !== id));
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Propuestas de Viaje</h1>
        <p className="text-sm text-muted-foreground">
          {initial.length} {initial.length === 1 ? "propuesta creada" : "propuestas creadas"}
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
            placeholder="Buscar por cliente, destino o título…"
            className="pl-9"
            aria-label="Buscar propuestas"
          />
          {isSearching && (
            <Loader2
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
        <Button variant="gold" className="w-full sm:w-auto" nativeButton={false} render={<Link href="/proposals/new" />}>
          <Plus /> Nueva propuesta
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {initial.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border px-6 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <FileText className="size-5" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">Aún no tienes propuestas</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crea tu primera propuesta comercial y deja que la IA redacte la presentación por ti.
            </p>
          </div>
          <Button variant="gold" nativeButton={false} render={<Link href="/proposals/new" />}>
            <Plus /> Nueva propuesta
          </Button>
        </div>
      ) : results.length === 0 && !isSearching ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border px-6 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <SearchX className="size-5" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">Sin resultados</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              No encontramos propuestas que coincidan con &ldquo;{query}&rdquo;.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleQueryChange("")}>
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
