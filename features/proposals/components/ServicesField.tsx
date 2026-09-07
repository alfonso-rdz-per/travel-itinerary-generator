"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProposalCurrency } from "@/types/proposal";
import type { ServiceRow } from "../formState";

interface ServicesFieldProps {
  services: ServiceRow[];
  currency: ProposalCurrency;
  error?: string;
  /** Mapa de errores por ruta ("services.0.name", …) que devuelve fieldErrorsFromZod. */
  fieldErrors?: Record<string, string[]>;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<ServiceRow, "id">>) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

/**
 * Actividades y servicios de la propuesta. El PRECIO lo escribe el agente a
 * mano y se conserva exactamente: la IA nunca lo ve ni lo modifica, y el total
 * se suma en código.
 */
export function ServicesField({
  services,
  currency,
  error,
  fieldErrors = {},
  onAdd,
  onRemove,
  onUpdate,
}: ServicesFieldProps) {
  const errFor = (index: number, field: string) => fieldErrors[`services.${index}.${field}`]?.[0];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Actividades y servicios</h2>
        <p className="text-sm text-muted-foreground">
          Agrega cada servicio con su precio. El precio se conserva tal cual lo escribes; la IA solo
          redacta la descripción.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {services.map((service, index) => (
          <Card key={service.id} className="shadow-sm ring-0">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Servicio {index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(service.id)}
                disabled={services.length <= 1}
                title={services.length > 1 ? "Eliminar servicio" : "Debe existir al menos un servicio"}
                aria-label={`Eliminar servicio ${index + 1}`}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`svc-day-${index}`}>
                  Día o fecha <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={`svc-day-${index}`}
                  value={service.dayLabel}
                  onChange={(event) => onUpdate(service.id, { dayLabel: event.target.value })}
                />
                <FieldError message={errFor(index, "dayLabel")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`svc-place-${index}`}>
                  Lugar <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={`svc-place-${index}`}
                  value={service.place}
                  onChange={(event) => onUpdate(service.id, { place: event.target.value })}
                />
                <FieldError message={errFor(index, "place")} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor={`svc-name-${index}`}>Nombre de la actividad / servicio</Label>
                <Input
                  id={`svc-name-${index}`}
                  value={service.name}
                  onChange={(event) => onUpdate(service.id, { name: event.target.value })}
                  aria-invalid={!!errFor(index, "name")}
                />
                <FieldError message={errFor(index, "name")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`svc-price-${index}`}>
                  Precio ({currency}) <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={`svc-price-${index}`}
                  inputMode="decimal"
                  value={service.price}
                  onChange={(event) => onUpdate(service.id, { price: event.target.value })}
                  aria-invalid={!!errFor(index, "price")}
                />
                <FieldError message={errFor(index, "price")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`svc-notes-${index}`}>
                  Observaciones <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={`svc-notes-${index}`}
                  value={service.notes}
                  onChange={(event) => onUpdate(service.id, { notes: event.target.value })}
                />
                <FieldError message={errFor(index, "notes")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" variant="outline" onClick={onAdd} className="w-fit">
        <Plus /> Agregar servicio
      </Button>
    </div>
  );
}
