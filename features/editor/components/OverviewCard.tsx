import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GeminiOverview } from "@/types/itinerary";

function OverviewCardComponent({
  overview,
  onChange,
}: {
  overview: GeminiOverview;
  onChange: (patch: Partial<GeminiOverview>) => void;
}) {
  return (
    <Card className="shadow-sm ring-0">
      <CardHeader>
        <CardTitle className="text-base">Resumen general</CardTitle>
        <CardDescription>Lo primero que leerá el pasajero después de la portada.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="overview-title">Título</Label>
          <Input
            id="overview-title"
            value={overview.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="overview-description">Descripción</Label>
          <Textarea
            id="overview-description"
            value={overview.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={5}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const OverviewCard = memo(OverviewCardComponent);
