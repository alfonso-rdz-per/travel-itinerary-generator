"use client";

import { Plane, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type FlightRow = { id: string; description: string; date: string; time: string };

export function createFlightRow(description = "", date = "", time = ""): FlightRow {
  return { id: crypto.randomUUID(), description, date, time };
}

interface FlightsFieldProps {
  flights: FlightRow[];
  error?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<FlightRow, "id">>) => void;
}

/**
 * Sección "Vuelos y horarios", justo debajo del destino. Cada fila es un dato
 * suelto (descripción obligatoria + fecha y hora opcionales) que se mostrará
 * TAL CUAL en el PDF — sirve para indicar a qué vuelo dirigirse o a qué hora
 * llegar al aeropuerto. La IA no interviene en este contenido.
 */
export function FlightsField({ flights, error, onAdd, onRemove, onUpdate }: FlightsFieldProps) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <div className="flex flex-col gap-0.5">
        <Label className="flex items-center gap-1.5">
          <Plane className="size-4 text-muted-foreground" aria-hidden />
          Vuelos y horarios <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Datos: A qué vuelo dirigirse, a qué hora llegar al
          aeropuerto, número de reserva, etc.
        </p>
      </div>

      {flights.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          {flights.map((flight, index) => (
            <div key={flight.id} className="flex flex-col gap-2">
              {index > 0 && <div className="border-t border-border" />}
              <div className="flex items-start gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <Input
                    value={flight.description}
                    onChange={(event) => onUpdate(flight.id, { description: event.target.value })}
                    placeholder="Vuelos"
                    aria-label={`Dato de vuelo ${index + 1}`}
                    aria-invalid={!!error}
                  />
                  <div className="flex flex-wrap gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Fecha</span>
                      <Input
                        type="date"
                        className="w-auto"
                        value={flight.date}
                        onChange={(event) => onUpdate(flight.id, { date: event.target.value })}
                        aria-label={`Fecha del vuelo ${index + 1}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Hora</span>
                      <Input
                        type="time"
                        className="w-auto"
                        value={flight.time}
                        onChange={(event) => onUpdate(flight.id, { time: event.target.value })}
                        aria-label={`Hora del vuelo ${index + 1}`}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(flight.id)}
                  aria-label={`Eliminar dato de vuelo ${index + 1}`}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={onAdd}
      >
        <Plus /> Agregar vuelo / horario
      </Button>
    </div>
  );
}
