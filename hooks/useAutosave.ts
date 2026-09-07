"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export type AutosaveResult = { success: boolean; error?: string };

/**
 * Guarda `value` automáticamente con un debounce (nunca en cada tecla). Si
 * `value` cambia mientras hay un guardado en curso, ese resultado se ignora
 * al llegar (se compara una "generación") para que un guardado más nuevo
 * nunca sea pisado por la respuesta de uno viejo. `value` en sí nunca se
 * toca — el estado del formulario nunca se pierde aunque el guardado falle.
 *
 * Blindaje (Fase 9A, prioridad 8 — "nunca perder información"):
 * - Si el componente se desmonta (navegación dentro de la app) con un
 *   guardado pendiente de debounce, o con el último intento en `error`, se
 *   dispara un guardado de último momento (best-effort: ya no hay UI que
 *   actualizar, pero la Server Action sigue su curso en segundo plano).
 * - Si el usuario cierra la pestaña o recarga con cambios sin guardar
 *   (debounce pendiente, guardado en curso, o el último falló), se le avisa
 *   con el diálogo nativo de "salir sin guardar" — un `fetch` a mitad de un
 *   cierre real de pestaña puede cancelarse, así que la única garantía
 *   verdadera en ese caso es darle al usuario la oportunidad de esperar.
 */
export function useAutosave<T>(value: T, save: (value: T) => Promise<AutosaveResult>, delayMs = 1000) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const valueRef = useRef(value);
  const saveRef = useRef(save);
  const statusRef = useRef(status);
  const isSavingRef = useRef(false);

  // Mantiene los refs al día sin mutarlos durante el render (regla
  // react-hooks/refs): runSave() y los listeners de abajo solo los leen
  // después, de forma asíncrona o desde un evento del navegador.
  useEffect(() => {
    valueRef.current = value;
    saveRef.current = save;
    statusRef.current = status;
  });

  const generationRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Captura el valor con el que se montó el hook (una sola vez: useRef ignora
  // este argumento en renders posteriores) para nunca programar un guardado
  // por el valor inicial — a diferencia de un flag "ya corrió una vez", esto
  // sigue siendo correcto aunque el efecto se invoque dos veces en el mismo
  // montaje (React Strict Mode en desarrollo).
  const initialValueRef = useRef(value);

  const runSave = useCallback(async () => {
    const generation = ++generationRef.current;
    const toSave = valueRef.current;
    isSavingRef.current = true;
    setStatus("saving");
    setError(null);

    try {
      const result = await saveRef.current(toSave);

      if (generation !== generationRef.current) return; // ya hay un guardado más nuevo en curso

      if (result.success) {
        setStatus("saved");
      } else {
        setStatus("error");
        setError(result.error ?? "No se pudo guardar. Intenta de nuevo.");
      }
    } finally {
      if (generation === generationRef.current) isSavingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (value === initialValueRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      runSave();
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  // Flush al desmontar (navegación dentro de la app): nunca dejar un cambio
  // debounced sin intentar guardarlo, ni un guardado previo en `error` sin
  // un último intento. `runSave` es estable (useCallback sin dependencias),
  // así que este cleanup solo se ejecuta en el desmontaje real, no en cada
  // render.
  useEffect(() => {
    return () => {
      const hadPendingDebounce = timeoutRef.current !== null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if ((hadPendingDebounce || statusRef.current === "error") && !isSavingRef.current) {
        runSave();
      }
    };
  }, [runSave]);

  // Cierre de pestaña / recarga con cambios sin guardar: advertir con el
  // diálogo nativo del navegador en vez de perder el cambio en silencio.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const hasUnsavedWork = timeoutRef.current !== null || isSavingRef.current || statusRef.current === "error";
      if (!hasUnsavedWork) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const retry = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    runSave();
  }, [runSave]);

  return { status, error, retry };
}
