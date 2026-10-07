import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { TripFilters } from "@/features/trips/components/trip-filters";
import { TripList } from "@/features/trips/components/trip-list";
import { TripsEmptyState } from "@/features/trips/components/trips-empty-state";
import { mockTrips } from "@/features/trips/data/trip-mock";
import {
  filterTrips,
  parseTripFilters,
  type TripSearchParams,
} from "@/features/trips/lib/trip-filters";

export const metadata: Metadata = {
  title: "Suas viagens",
  description: "Organize suas viagens, destinos e roteiros em um só lugar.",
};

type TripsPageProps = Readonly<{
  searchParams: Promise<TripSearchParams>;
}>;

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const filters = parseTripFilters(await searchParams);
  const trips = mockTrips;
  const filteredTrips = filterTrips(trips, filters);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
     <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div className="space-y-2">
    <h1 className="text-3xl font-bold tracking-tight">
      Suas viagens
    </h1>

    <p className="text-muted-foreground">
      Seus próximos destinos e as histórias que você já viveu.
    </p>
  </div>

  <Link
    href="/viagens/nova"
    className={buttonVariants()}
  >
    <Plus aria-hidden="true" className="size-4" />
    Nova viagem
  </Link>
</header>

      {trips.length === 0 ? (
        <TripsEmptyState variant="no-trips" />
      ) : (
        <>
          <TripFilters filters={filters} />

          <section aria-label="Resultados da busca" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {filteredTrips.length}{" "}
              {filteredTrips.length === 1
                ? "viagem encontrada"
                : "viagens encontradas"}
            </p>

            {filteredTrips.length > 0 ? (
              <TripList trips={filteredTrips} />
            ) : (
              <TripsEmptyState variant="no-results" />
            )}
          </section>
        </>
      )}
    </main>
  );
}