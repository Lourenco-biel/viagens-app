"use client";

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants, Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/feedback";
import { TRIPS } from "../graphql/documents";
import { TripList } from "./trip-list";
import { TripFilters } from "./trip-filters";
import { TripsEmptyState } from "./trips-empty-state";
import type { TripFilters as Filters } from "../model/trip";
import { errorMessage } from "@/lib/graphql/error-message";

export function TripsOverview({ filters, page }: { filters: Filters; page: number }) {
  const params = useSearchParams();
  const { data, loading, error, refetch } = useQuery(TRIPS, {
    variables: { filters: { ...filters, offset: (page - 1) * 12, limit: 12 } },
  });
  function pageHref(next: number) {
    const query = new URLSearchParams(params);
    query.set("page", String(next));
    return "/viagens?" + query.toString();
  }
  return (
    <div className="space-y-6">
      <TripFilters filters={filters} />
      {error ? (
        <ErrorState
          message={errorMessage(error)}
          retry={() => {
            void refetch();
          }}
        />
      ) : loading && !data ? (
        <LoadingState label="Carregando suas viagens..." />
      ) : (
        data &&
        (!data.trips.hasTrips ? (
          <TripsEmptyState variant="no-trips" />
        ) : (
          <section aria-label="Resultados da busca" className="space-y-5" aria-busy={loading}>
            <p role="status" className="text-sm text-muted-foreground">
              {data.trips.total}{" "}
              {data.trips.total === 1 ? "viagem encontrada" : "viagens encontradas"}
            </p>
            {data.trips.items.length ? (
              <TripList trips={data.trips.items} />
            ) : (
              <TripsEmptyState variant="no-results" />
            )}
            {(page > 1 || data.trips.total > 12) && (
              <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
                {page > 1 ? (
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href={pageHref(page - 1)}
                  >
                    Anterior
                  </Link>
                ) : (
                  <Button variant="outline" disabled>
                    Anterior
                  </Button>
                )}
                <span className="text-sm">Página {page}</span>
                {page * 12 < data.trips.total ? (
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href={pageHref(page + 1)}
                  >
                    Próxima
                  </Link>
                ) : (
                  <Button variant="outline" disabled>
                    Próxima
                  </Button>
                )}
              </nav>
            )}
          </section>
        ))
      )}
    </div>
  );
}
