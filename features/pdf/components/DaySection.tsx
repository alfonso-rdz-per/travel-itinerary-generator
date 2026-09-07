import { View, Text } from "@react-pdf/renderer";
import type { GeminiActivity, ManualNote } from "@/types/itinerary";
import { styles } from "../styles";
import { DayImages, type PreparedImage } from "./DayImages";

export type PreparedDay = {
  day: number;
  title: string;
  introduction: string;
  activities: GeminiActivity[];
  recommendations: string[];
  tips: string[];
  /** "Datos" manuales del agente (texto libre) — la IA nunca los produjo. */
  manualNotes: ManualNote[];
  images: PreparedImage[];
};

// El PDF muestra el LUGAR como viñeta, nunca la "actividad" (esa solo le da
// contexto a Gemini para redactar `description`, ver prompts/itinerary-generator.md sección 4).
function activityHeading(activity: GeminiActivity): string {
  return activity.place.trim() || activity.activity;
}

export function DaySection({ day, isLast }: { day: PreparedDay; isLast: boolean }) {
  return (
    <View style={styles.daySection}>
      {/* Título nunca se divide ni queda solo al final de una hoja. */}
      <View style={styles.dayHeader} wrap={false} minPresenceAhead={90}>
        <Text style={styles.dayTitle}>
          Día {day.day} - {day.title.replace(/^Día\s*\d+\s*[-–—:]\s*/i, "")}
        </Text>
      </View>

      {/* "Datos" del agente: texto libre, justo debajo del título, etiqueta en negritas. */}
      {day.manualNotes.length > 0 && (
        <View style={styles.manualNotes}>
          {day.manualNotes.map((note, index) => (
            <Text key={index} style={styles.manualNote} wrap={false}>
              <Text style={styles.manualNoteTitle}>{note.title}: </Text>
              {note.body}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.dayIntroduction}>{day.introduction}</Text>

      <DayImages images={day.images} />

      <View style={styles.activitiesList}>
        {day.activities.map((activity, index) => (
          <View key={index} style={styles.activityItem} wrap={false}>
            <Text style={styles.activityBullet}>• {activityHeading(activity)}</Text>
            <Text style={styles.activityDescription}>{activity.description}</Text>
          </View>
        ))}
      </View>

      {day.recommendations.length > 0 && (
        <View style={styles.recommendationsSection} wrap={false}>
          <Text style={styles.sectionLabel}>Recomendaciones</Text>
          {day.recommendations.map((item, index) => (
            <View key={index} style={styles.listItemRow}>
              <Text style={styles.listItemBullet}>•</Text>
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {day.tips.length > 0 && (
        <View style={styles.tipsSection} wrap={false}>
          <Text style={styles.sectionLabel}>Consejos</Text>
          {day.tips.map((item, index) => (
            <View key={index} style={styles.listItemRow}>
              <Text style={styles.listItemBullet}>•</Text>
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {!isLast && <View style={styles.daySeparator} />}
    </View>
  );
}
