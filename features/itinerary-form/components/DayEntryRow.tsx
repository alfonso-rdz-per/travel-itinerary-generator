"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DayEntry } from "../hooks/useItineraryDays";

interface DayEntryRowProps {
  entry: DayEntry;
  index: number;
  isOnlyEntry: boolean;
  isLeaving: boolean;
  autoFocus: boolean;
  onFocused: () => void;
  registerPlaceRef: (id: string, el: HTMLInputElement | null) => void;
  onChangePlace: (value: string) => void;
  onChangeActivity: (value: string) => void;
  onRemove: () => void;
  onEnter: () => void;
}

export function DayEntryRow({
  entry,
  index,
  isOnlyEntry,
  isLeaving,
  autoFocus,
  onFocused,
  registerPlaceRef,
  onChangePlace,
  onChangeActivity,
  onRemove,
  onEnter,
}: DayEntryRowProps) {
  const placeInputRef = useRef<HTMLInputElement>(null);
  const isEntryEmpty = entry.place === "" && entry.activity === "";

  useEffect(() => {
    if (autoFocus) {
      placeInputRef.current?.focus();
      onFocused();
    }
    // Solo debe enfocar al montarse (cuando este registro se acaba de agregar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlaceKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
    } else if (event.key === "Backspace" && isEntryEmpty && !isOnlyEntry) {
      event.preventDefault();
      onRemove();
    }
  }

  function handleActivityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
    }
  }

  return (
    <div
      className={
        isLeaving
          ? "flex items-start gap-2 animate-out fade-out slide-out-to-left-2 duration-150"
          : "flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
      }
    >
      <MapPin className="mt-2.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <Input
          ref={(el) => {
            placeInputRef.current = el;
            registerPlaceRef(entry.id, el);
          }}
          value={entry.place}
          onChange={(event) => onChangePlace(event.target.value)}
          placeholder={index === 0 ? "Lugar" : "Otro lugar"}
          aria-label={`Lugar ${index + 1}`}
          onKeyDown={handlePlaceKeyDown}
          className="sm:flex-1"
        />
        <Input
          value={entry.activity}
          onChange={(event) => onChangeActivity(event.target.value)}
          placeholder={
            index === 0 ? "Actividad (opcional)" : "Otra actividad (opcional)"
          }
          aria-label={`Actividad ${index + 1}`}
          onKeyDown={handleActivityKeyDown}
          className="sm:flex-[1.3]"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={isOnlyEntry}
        title={isOnlyEntry ? "Debe existir al menos un lugar" : "Eliminar lugar"}
        aria-label="Eliminar lugar"
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <X />
      </Button>
    </div>
  );
}
