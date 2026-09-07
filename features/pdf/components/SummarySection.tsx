import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { formatDateRange } from "@/utils/formatDate";

export function SummarySection({
  title,
  description,
  passengerName,
  destination,
  startDate,
  endDate,
}: {
  title: string;
  description: string;
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
}) {
  return (
    <View>
      <Text style={styles.overviewTitle}>{title}</Text>
      <Text style={styles.overviewMeta}>
        {passengerName} · {destination} · {formatDateRange(startDate, endDate)}
      </Text>
      <Text style={styles.sectionLabel}>Resumen General</Text>
      <Text style={styles.overviewDescription}>{description}</Text>
    </View>
  );
}
