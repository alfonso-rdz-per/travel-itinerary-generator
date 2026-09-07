import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente administrativo con la Service Role Key: ignora RLS por completo.
 *
 * Uso exclusivo en código de servidor que explícitamente necesite saltarse
 * Row Level Security. Nunca importar este archivo desde un Client Component
 * ni desde código que reenvíe directamente input del usuario sin revalidar
 * a quién pertenece cada registro.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
