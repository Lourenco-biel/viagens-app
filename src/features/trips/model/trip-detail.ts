import type { TripSummary } from "./trip";
import type { Activity, TripMember } from "./activity";

export type TripDetail = TripSummary & {
  isOwner: boolean;
  members: TripMember[];
  activities: Activity[];
};
