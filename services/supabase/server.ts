import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Lee y escribe la sesión a través de las cookies de la request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llamó desde un Server Component sin permiso de escritura de
            // cookies. Es seguro ignorarlo: el middleware refresca la sesión
            // en cada request.
          }
        },
      },
    },
  );
}
