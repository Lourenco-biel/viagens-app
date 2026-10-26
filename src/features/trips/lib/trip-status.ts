import type { TripStatus } from "../model/trip";

export function getTripStatus(startDate: string, endDate: string, today = new Date().toISOString().slice(0, 10)): TripStatus {
  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "ongoing";
}

