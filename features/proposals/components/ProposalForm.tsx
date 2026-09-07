"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, FileText, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProposalInput } from "@/types/proposal";
import { generateProposal, saveProposalDraft } from "../actions";
import { fieldErrorsFromZod, proposalFormSchema } from "../schema";
import {
  createServiceRow,
  emptyProposalFormState,
  formStateToValues,
  proposalInputToFormState,
  type ProposalFormState,
  type ServiceRow,
} from "../formState";
import { formatMoney, proposalTotal } from "../money";
import { CurrencySelect } from "./CurrencySelect";
import { ServicesField } from "./ServicesField";

export type ProposalFormInitialData = { id: string; input: ProposalInput };

const FIELD_LABELS: Record<string, string> = {
  "client.name": "Nombre del cliente",
  "client.email": "Correo del cliente",
  "client.phone": "Teléfono del cliente",
  "trip.destination": "Destino",
  "trip.startDate": "Fecha de salida",
  "trip.endDate": "Fecha de regreso",
  "trip.numDays": "Número de días",
  "trip.numTravelers": "Número de viajeros",
  "trip.tripType": "Tipo de viaje",
  "proposal.title": "Título de la propuesta",
  "proposal.introMessage": "Mensaje personalizado",
  "proposal.notes": "Notas adicionales",
  currency: "Moneda",
  services: "Servicios",
};

/** "services.1.name" → "Servicio 2 · Nombre"; "proposal.included.0" → "Servicios incluidos". */
function errorKeyLabel(key: string): string {
  if (key in FIELD_LABELS) return FIELD_LABELS[key];
  const serviceMatch = /^services\.(\d+)\.(\w+)$/.exec(key);
  if (serviceMatch) {
    const fieldLabels: Record<string, string> = {
      name: "Nombre",
      place: "Lugar",
      dayLabel: "Día o fecha",
      price: "Precio",
      notes: "Observaciones",
    };
    return `Servicio ${Number(serviceMatch[1]) + 1} · ${fieldLabels[serviceMatch[2]] ?? serviceMatch[2]}`;
  }
  if (key.startsWith("proposal.included")) return "Servicios incluidos";
  if (key.startsWith("proposal.notIncluded")) return "Servicios no incluidos";
  return "";
}

export function ProposalForm({ initialData }: { initialData?: ProposalFormInitialData }) {
  const isEditing = !!initialData;
  const [state, setState] = useState<ProposalFormState>(() =>
    initialData ? proposalInputToFormState(initialData.input) : emptyProposalFormState(),
  );
  const [proposalId] = useState<string | null>(initialData?.id ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();

  const busy = isSaving || isGenerating;

  function patchClient(patch: Partial<ProposalFormState["client"]>) {
    setState((prev) => ({ ...prev, client: { ...prev.client, ...patch } }));
  }
  function patchTrip(patch: Partial<ProposalFormState["trip"]>) {
    setState((prev) => ({ ...prev, trip: { ...prev.trip, ...patch } }));
  }
  function patchProposal(patch: Partial<ProposalFormState["proposal"]>) {
    setState((prev) => ({ ...prev, proposal: { ...prev.proposal, ...patch } }));
  }

  function addService() {
    setState((prev) => ({ ...prev, services: [...prev.services, createServiceRow()] }));
  }
  function removeService(id: string) {
    setState((prev) => ({ ...prev, services: prev.services.filter((service) => service.id !== id) }));
  }
  function updateService(id: string, patch: Partial<Omit<ServiceRow, "id">>) {
    setState((prev) => ({
      ...prev,
      services: prev.services.map((service) => (service.id === id ? { ...service, ...patch } : service)),
    }));
  }

  const runningTotal = useMemo(() => {
    const values = formStateToValues(state);
    return proposalTotal(values.services);
  }, [state]);

  function submit(action: "draft" | "generate") {
    setFormError(null);
    const values = formStateToValues(state);
    const parsed = proposalFormSchema.safeParse(values);

    if (!parsed.success) {
      const errors = fieldErrorsFromZod(parsed.error);
      setFieldErrors(errors);
      setFormError(
        action === "draft"
          ? "No se pudo guardar. Corrige lo siguiente:"
          : "No se pudo generar la propuesta. Corrige lo siguiente:",
      );
      return;
    }
    setFieldErrors({});

    const run = action === "draft" ? saveProposalDraft : generateProposal;
    const starter = action === "draft" ? startSaving : startGenerating;

    starter(async () => {
      const result = await run(parsed.data, proposalId ?? undefined);
      if (!result.success) {
        setFormError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  }

  const nested = (key: string) => fieldErrors[key]?.[0];

  // Lista legible de TODOS los errores (incluye los de servicios individuales,
  // que no tienen un mensaje inline propio) para que el agente sepa exactamente
  // qué corregir.
  const errorMessages = (() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const [key, messages] of Object.entries(fieldErrors)) {
      const prefix = errorKeyLabel(key);
      for (const message of messages) {
        const line = prefix ? `${prefix}: ${message}` : message;
        if (!seen.has(line)) {
          seen.add(line);
          out.push(line);
        }
      }
    }
    return out;
  })();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 pb-28 lg:p-8 lg:pb-28">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/proposals"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> Volver a propuestas
          </Link>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/proposals/${proposalId}`} />}
            >
              <Eye /> Previsualizar
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEditing ? "Editar propuesta" : "Crear nueva propuesta"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Captura la información del viaje. La propuesta comercial se redacta automáticamente.
          </p>
        </div>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>
            <p>{formError}</p>
            {errorMessages.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                {errorMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Datos del cliente */}
      <Card className="shadow-sm ring-0">
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
          <CardDescription>El correo y el teléfono son solo para tu referencia.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="client-name">Nombre del cliente</Label>
            <Input
              id="client-name"
              value={state.client.name}
              onChange={(event) => patchClient({ name: event.target.value })}
              aria-invalid={!!nested("client.name")}
            />
            {nested("client.name") && <p className="text-sm text-destructive">{nested("client.name")}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-email">
              Correo electrónico <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="client-email"
              type="email"
              value={state.client.email}
              onChange={(event) => patchClient({ email: event.target.value })}
              aria-invalid={!!nested("client.email")}
            />
            {nested("client.email") && <p className="text-sm text-destructive">{nested("client.email")}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client-phone">
              Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="client-phone"
              value={state.client.phone}
              onChange={(event) => patchClient({ phone: event.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Datos del viaje */}
      <Card className="shadow-sm ring-0">
        <CardHeader>
          <CardTitle className="text-base">Datos del viaje</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="destination">Destino o destinos</Label>
            <Input
              id="destination"
              value={state.trip.destination}
              onChange={(event) => patchTrip({ destination: event.target.value })}
              aria-invalid={!!nested("trip.destination")}
            />
            {nested("trip.destination") && (
              <p className="text-sm text-destructive">{nested("trip.destination")}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">
              Fecha de salida <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={state.trip.startDate}
              onChange={(event) => patchTrip({ startDate: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">
              Fecha de regreso <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              value={state.trip.endDate}
              onChange={(event) => patchTrip({ endDate: event.target.value })}
              aria-invalid={!!nested("trip.endDate")}
            />
            {nested("trip.endDate") && <p className="text-sm text-destructive">{nested("trip.endDate")}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numDays">
              Número de días <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="numDays"
              type="number"
              min={0}
              value={state.trip.numDays}
              onChange={(event) => patchTrip({ numDays: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numTravelers">
              Número de viajeros <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="numTravelers"
              type="number"
              min={0}
              value={state.trip.numTravelers}
              onChange={(event) => patchTrip({ numTravelers: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="tripType">
              Tipo o motivo del viaje <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="tripType"
              value={state.trip.tripType}
              onChange={(event) => patchTrip({ tripType: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="currency">Moneda de la propuesta</Label>
            <CurrencySelect
              id="currency"
              value={state.currency}
              onChange={(currency) => setState((prev) => ({ ...prev, currency }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información de la propuesta */}
      <Card className="shadow-sm ring-0">
        <CardHeader>
          <CardTitle className="text-base">Información de la propuesta</CardTitle>
          <CardDescription>Todo esto es opcional. La IA mejora la redacción de lo que escribas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">
              Título de la propuesta <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="title"
              value={state.proposal.title}
              onChange={(event) => patchProposal({ title: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="introMessage">
              Mensaje personalizado para el cliente{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="introMessage"
              rows={3}
              value={state.proposal.introMessage}
              onChange={(event) => patchProposal({ introMessage: event.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="included">
                Servicios incluidos <span className="font-normal text-muted-foreground">(uno por línea)</span>
              </Label>
              <Textarea
                id="included"
                rows={4}
                value={state.proposal.includedText}
                onChange={(event) => patchProposal({ includedText: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notIncluded">
                Servicios NO incluidos <span className="font-normal text-muted-foreground">(uno por línea)</span>
              </Label>
              <Textarea
                id="notIncluded"
                rows={4}
                value={state.proposal.notIncludedText}
                onChange={(event) => patchProposal({ notIncludedText: event.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">
              Notas adicionales <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={3}
              value={state.proposal.notes}
              onChange={(event) => patchProposal({ notes: event.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <ServicesField
        services={state.services}
        currency={state.currency}
        error={nested("services")}
        fieldErrors={fieldErrors}
        onAdd={addService}
        onRemove={removeService}
        onUpdate={updateService}
      />

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between lg:-mx-8 lg:px-8">
        <p className="text-xs text-muted-foreground">
          {isGenerating
            ? "Redactando la propuesta… puede tardar hasta un minuto."
            : `Total de la propuesta: ${formatMoney(runningTotal, state.currency)}`}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => submit("draft")} disabled={busy}>
            {isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Guardar borrador"}
          </Button>
          <Button
            type="button"
            variant="gold"
            size="lg"
            className="font-semibold"
            onClick={() => submit("generate")}
            disabled={busy}
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Generando…
              </>
            ) : (
              <>
                {isEditing ? <FileText /> : <Sparkles />} {isEditing ? "Guardar y regenerar" : "Generar propuesta"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
