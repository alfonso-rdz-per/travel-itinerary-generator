"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!state.fieldErrors?.email}
        />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <SubmitButton>Enviar enlace de recuperación</SubmitButton>

      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
