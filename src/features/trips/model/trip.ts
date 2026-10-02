export type TripStatus = "upcoming" | "ongoing" | "completed";

export type TripSummary = Readonly<{
  id: string;
  name: string;
  destination: string;

  startDate: string;
  endDate: string;

  participantCount: number;
  status: TripStatus;
}>

export type TripFilters = Readonly<{
  query: string;
  status: TripStatus | "all";
}>