import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardContent } from "@/features/dashboard/components/DashboardContent";
import type { DashboardItinerary } from "@/features/dashboard/types";
import { createClient } from "@/services/supabase/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: "draft" | "generated"; imagesIncomplete?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error: loadError } = user
    ? await supabase
        .from("itineraries")
        .select("id, passenger_name, destination, start_date, end_date, status, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
    : { data: null, error: null };

  if (loadError) {
    console.error("[DashboardPage] load itineraries", loadError);
  }

  const itineraries: DashboardItinerary[] = (rows ?? []).map((row) => ({
    id: row.id,
    passengerName: row.passenger_name,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return (
    <div className="flex flex-1 flex-col">
      {loadError && (
        <div className="px-4 pt-4 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              No se pudieron cargar tus itinerarios en este momento. Intenta recargar la página en unos
              segundos.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {params.created === "draft" && (
        <div className="px-4 pt-4 lg:px-8">
          <Alert>
            <AlertDescription>Borrador guardado correctamente.</AlertDescription>
          </Alert>
        </div>
      )}
      {params.created === "generated" && (
        <div className="px-4 pt-4 lg:px-8">
          <Alert>
            <AlertDescription>
              {params.imagesIncomplete === "1"
                ? "Itinerario generado correctamente, aunque no se pudieron obtener automáticamente todas las imágenes. Puedes intentar generarlo de nuevo más tarde."
                : "Itinerario generado correctamente."}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <DashboardContent itineraries={itineraries} />
    </div>
  );
}
