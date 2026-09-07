"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./schema";

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

const GENERIC_ERROR = "Ocurrió un problema. Intenta de nuevo.";

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: "Revisa los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: "Revisa los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  });

  // Se responde el mismo mensaje exista o no la cuenta, para no revelar
  // qué correos están registrados en el sistema.
  if (error) {
    return { error: GENERIC_ERROR };
  }

  return {
    success: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
  };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: "Revisa los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: "No se pudo actualizar la contraseña. El enlace pudo haber expirado." };
  }

  await supabase.auth.signOut();
  redirect("/login?message=password-updated");
}
