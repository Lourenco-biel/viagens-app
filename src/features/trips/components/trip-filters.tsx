import Link from "next/link";

import { getTripFiltersHref } from "../lib/trip-filters";
import type { TripFilters as TripFiltersValue } from "../model/trip";
import { cn } from "@/lib/utils";

type TripeFiltersProps = Readonly<{
  filters: TripFiltersValue;
}>;

const statusOptions = [
  { value: "all", label: "Todas" },
  { value: "upcoming", label: "Próximas" },
  { value: "ongoing", label: "Em andamento" },
  { value: "completed", label: "Concluídas" },
] satisfies ReadonlyArray<{
  value: TripFiltersValue["status"];
  label: string;
}>;

export function TripFilters({ filters }: TripeFiltersProps) {
  return (
    <div className="space-y-4">
      <form
        key={getTripFiltersHref(filters)}
        action="/viagens"
        method="get"
        role="search"
        aria-label="Buscar Viagens"
        className="flex flex-col gap-3 sm:flex-rom sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <label htmlFor="trip-search" className="text-sm font-medium">
            Buscar Viagem
          </label>

          <input
            id="trip-search"
            type="search"
            name="q"
            defaultValue={filters.query}
            placeholder="Nome da viagem ou destino"
          />
        </div>

        <input type="hidden" name="status" value={filters.status} />
        <button type="submit">Buscar</button>
      </form>

      <nav
        aria-label="Filtar viagens por status"
        className="flex flex-wrap gap-2"
      >
        {statusOptions.map((option) => {
          const isActive = filters.status === option.value;

          return (
            <Link
              key={option.value}
              href={getTripFiltersHref({
                ...filters,
                status: option.value,
              })}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
