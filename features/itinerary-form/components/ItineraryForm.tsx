"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ItineraryFlight } from "@/types/itinerary";
import { createDraftItinerary, generateItinerary } from "../actions";
import { itineraryFormSchema } from "../schema";
import { useItineraryDays, type InitialItineraryDay } from "../hooks/useItineraryDays";
import { DayCard } from "./DayCard";
import { FlightsField, createFlightRow, type FlightRow } from "./FlightsField";

type GeneralInfo = {
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
  observations: string;
};

const initialGeneralInfo: GeneralInfo = {
  passengerName: "",
  destination: "",
  startDate: "",
  endDate: "",
  observations: "",
};

/** Precarga para retomar un borrador/error existente — ver app/(app)/itineraries/[id]/edit/page.tsx. */
export type InitialItineraryFormData = {
  itineraryId: string;
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
  observations: string;
  flights: ItineraryFlight[];
  days: InitialItineraryDay[];
};

export function ItineraryForm({ initialData }: { initialData?: InitialItineraryFormData }) {
  const isResuming = !!initialData;
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>(
    initialData
      ? {
          passengerName: initialData.passengerName,
          destination: initialData.destination,
          startDate: initialData.startDate,
          endDate: initialData.endDate,
          observations: initialData.observations,
        }
      : initialGeneralInfo,
  );
  const [flights, setFlights] = useState<FlightRow[]>(
    initialData?.flights?.map((flight) =>
      createFlightRow(flight.description, flight.date ?? "", flight.time ?? ""),
    ) ?? [],
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  // Un mismo trabajo del agente = un solo registro en Supabase (Fase 10): una
  // vez que existe un id (porque veníamos de un borrador/error, o porque
  // "Generar" ya creó uno en un intento previo dentro de esta misma sesión
  // del formulario), toda acción posterior actualiza ESE registro en vez de
  // insertar uno nuevo.
  const [itineraryId, setItineraryId] = useState<string | null>(initialData?.itineraryId ?? null);

  const {
    days,
    leavingDayIds,
    leavingEntryIds,
    focusEntryId,
    clearFocusRequest,
    registerPlaceInput,
    focusEntry,
    addDay,
    removeDay,
    addEntry,
    removeEntry,
    updateEntry,
    addManualNote,
    removeManualNote,
    updateManualNote,
  } = useItineraryDays(initialData?.days);

  function updateField<K extends keyof GeneralInfo>(key: K, value: GeneralInfo[K]) {
    setGeneralInfo((prev) => ({ ...prev, [key]: value }));
  }

  function addFlight() {
    setFlights((prev) => [...prev, createFlightRow()]);
  }

  function removeFlight(id: string) {
    setFlights((prev) => prev.filter((flight) => flight.id !== id));
  }

  function updateFlight(id: string, patch: Partial<Omit<FlightRow, "id">>) {
    setFlights((prev) => prev.map((flight) => (flight.id === id ? { ...flight, ...patch } : flight)));
  }

  function buildPayload() {
    return {
      ...generalInfo,
      observations: generalInfo.observations.trim() || undefined,
      // Filas sin descripción se descartan: son filas que el agente agregó y
      // no llegó a llenar — no deben bloquear la validación.
      flights: flights
        .map((flight) => ({
          description: flight.description.trim(),
          date: flight.date || undefined,
          time: flight.time || undefined,
        }))
        .filter((flight) => flight.description.length > 0),
      days: days.map((day) => ({
        places: day.entries.map((entry) => ({ place: entry.place, activity: entry.activity })),
        // Filas totalmente vacías se descartan (agregadas y no llenadas).
        manualNotes: day.manualNotes
          .map((note) => ({ title: note.title.trim(), body: note.body.trim() }))
          .filter((note) => note.title.length > 0 || note.body.length > 0),
      })),
    };
  }

  function handleSaveDraft() {
    setFormError(null);

    const parsed = itineraryFormSchema.safeParse(buildPayload());

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setFormError("Revisa los campos marcados antes de guardar.");
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await createDraftItinerary(parsed.data, itineraryId ?? undefined);
      if (!result.success) {
        setFormError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  }

  function handleGenerate() {
    if (isGenerating) return;
    setFormError(null);

    const parsed = itineraryFormSchema.safeParse(buildPayload());

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setFormError("Revisa los campos marcados antes de generar el itinerario.");
      return;
    }

    setFieldErrors({});

    startGenerating(async () => {
      const result = await generateItinerary(parsed.data, itineraryId ?? undefined);
      if (!result.success) {
        setFormError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        // Aunque haya fallado, el registro ya existe en Supabase (Gemini se
        // alcanzó a llamar) — lo recordamos para que "Reintentar" o
        // "Guardar Itinerario" reutilicen este mismo id en vez de crear otro.
        if (result.id) setItineraryId(result.id);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 pb-28 lg:p-8 lg:pb-28">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Volver a itinerarios
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isResuming ? "Continuar itinerario" : "Nuevo itinerario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isResuming
              ? "Revisa o completa los datos y genera el itinerario cuando estés listo."
              : "Captura lo esencial del viaje. Nosotros nos encargamos de redactarlo."}
          </p>
        </div>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm ring-0">
        <CardHeader>
          <CardTitle className="text-base">Información general</CardTitle>
          <CardDescription>Los datos esenciales del viajero y su viaje.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="passengerName">Nombre del pasajero</Label>
            <Input
              id="passengerName"
              value={generalInfo.passengerName}
              onChange={(event) => updateField("passengerName", event.target.value)}
              placeholder="Nombre"
              aria-invalid={!!fieldErrors.passengerName}
            />
            {fieldErrors.passengerName && (
              <p className="text-sm text-destructive">{fieldErrors.passengerName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="destination">Destino principal</Label>
            <Input
              id="destination"
              value={generalInfo.destination}
              onChange={(event) => updateField("destination", event.target.value)}
              placeholder="Lugar"
              aria-invalid={!!fieldErrors.destination}
            />
            {fieldErrors.destination && (
              <p className="text-sm text-destructive">{fieldErrors.destination[0]}</p>
            )}
          </div>

          <FlightsField
            flights={flights}
            error={fieldErrors.flights?.[0]}
            onAdd={addFlight}
            onRemove={removeFlight}
            onUpdate={updateFlight}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={generalInfo.startDate}
              onChange={(event) => updateField("startDate", event.target.value)}
              aria-invalid={!!fieldErrors.startDate}
            />
            {fieldErrors.startDate && (
              <p className="text-sm text-destructive">{fieldErrors.startDate[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">Fecha final</Label>
            <Input
              id="endDate"
              type="date"
              value={generalInfo.endDate}
              onChange={(event) => updateField("endDate", event.target.value)}
              aria-invalid={!!fieldErrors.endDate}
            />
            {fieldErrors.endDate && (
              <p className="text-sm text-destructive">{fieldErrors.endDate[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="observations">
              Observaciones <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="observations"
              value={generalInfo.observations}
              onChange={(event) => updateField("observations", event.target.value)}
              placeholder="Cualquier detalle adicional que debamos conocer…"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Itinerario</h2>
          <p className="text-sm text-muted-foreground">
            Agrega los lugares que visitará cada día. Nosotros redactamos el resto.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {days.map((day, index) => (
            <DayCard
              key={day.id}
              day={day}
              dayNumber={index + 1}
              canRemoveDay={days.length > 1}
              isLeaving={leavingDayIds.has(day.id)}
              leavingEntryIds={leavingEntryIds}
              focusEntryId={focusEntryId}
              onClearFocusRequest={clearFocusRequest}
              registerPlaceInput={registerPlaceInput}
              focusEntry={focusEntry}
              onRemoveDay={() => removeDay(day.id)}
              onAddEntry={() => addEntry(day.id)}
              onRemoveEntry={(entryId) => removeEntry(day.id, entryId)}
              onUpdateEntry={(entryId, patch) => updateEntry(day.id, entryId, patch)}
              onAddManualNote={() => addManualNote(day.id)}
              onRemoveManualNote={(noteId) => removeManualNote(day.id, noteId)}
              onUpdateManualNote={(noteId, patch) => updateManualNote(day.id, noteId, patch)}
            />
          ))}
        </div>

        {fieldErrors.days && <p className="text-sm text-destructive">{fieldErrors.days[0]}</p>}

        <Button type="button" variant="outline" onClick={addDay} className="w-fit">
          <Plus /> Agregar día
        </Button>
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between lg:-mx-8 lg:px-8">
        <p className="text-xs text-muted-foreground">
          {isGenerating
            ? "Generando tu itinerario con IA… esto puede tardar hasta un minuto."
            : "✨ La IA completará automáticamente los textos, recomendaciones e imágenes de tu itinerario."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isPending || isGenerating}
          >
            {isPending ? "Guardando…" : "Guardar Itinerario"}
          </Button>
          <Button
            type="button"
            variant="gold"
            size="lg"
            className="font-semibold"
            onClick={handleGenerate}
            disabled={isPending || isGenerating}
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Generando…
              </>
            ) : (
              <>
                <Sparkles /> Generar Itinerario
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
