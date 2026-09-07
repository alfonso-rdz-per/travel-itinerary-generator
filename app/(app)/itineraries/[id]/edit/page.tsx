import { notFound } from "next/navigation";
import { EditorContent } from "@/features/editor/components/EditorContent";
import { ItineraryForm } from "@/features/itinerary-form/components/ItineraryForm";
import { createClient } from "@/services/supabase/server";
import type { ItineraryJsonData } from "@/types/itinerary";

export default async function EditItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: row, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) notFound();

  const jsonData = row.json_data as ItineraryJsonData;

  // Sin contenido generado todavía (draft, generating interrumpido, o error
  // de una generación anterior): en vez de un callejón sin salida, se
  // retoma el formulario con lo ya capturado — "Generar"/"Guardar" desde
  // aquí actualizan este mismo registro (ver features/itinerary-form/actions.ts).
  if (!jsonData.generated) {
    return (
      <ItineraryForm
        initialData={{
          itineraryId: row.id,
          passengerName: row.passenger_name,
          destination: row.destination,
          startDate: row.start_date,
          endDate: row.end_date,
          observations: row.observations ?? "",
          flights: jsonData.input.flights ?? [],
          days: jsonData.input.days,
        }}
      />
    );
  }

  return (
    <EditorContent
      itineraryId={row.id}
      initialGenerated={jsonData.generated}
      passengerName={row.passenger_name}
      destination={row.destination}
      startDate={row.start_date}
      endDate={row.end_date}
    />
  );
}
