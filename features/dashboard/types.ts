import type { ItineraryStatus } from "@/types/database";

export type DashboardItinerary = {
  id: string;
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: ItineraryStatus;
  createdAt: string;
  updatedAt: string;
};
