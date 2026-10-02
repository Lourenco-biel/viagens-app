import { TripSummary, TripFilters } from "./../model/trip";

export type TripSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function parseTripFilters(searchParams:TripSearchParams ): TripFilters{
  const requestedStatus = firstValue(searchParams.status);

  const status =
  requestedStatus === "upcoming" ||
  requestedStatus === "ongoing"||
  requestedStatus === "completed"
  ? requestedStatus
  : "all";

  return{
    query: firstValue(searchParams.q).trim(),
    status,
  }
}


export function filterTrips(trips: readonly TripSummary[], filters: TripFilters): TripSummary[]{
  const query = normalizeText(filters.query);

  return trips.filter((trip)=>{
    const matchesQuery = 
    filters.status === "all"|| trip.status=== filters.status;

    const searchableText = normalizeText(`${trip.name} ${trip.destination}`)

    return matchesQuery && searchableText.includes(query)
  })
}

export function getTripFiltersHref(filters: TripFilters): string {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  const queryString = params.toString();

  return queryString ? `/viagens?${queryString}` : "/viagens";
}