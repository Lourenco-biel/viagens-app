import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

import { formatTripDate } from "../lib/format-trip-date";
import type { TripSummary, TripStatus } from "../model/trip";
import { ArrowRight, CalendarDays, MapPin, UserRound } from "lucide-react";
import Link from "next/link";

type TripCardProps = Readonly<{
  trip: TripSummary;
}>;

const statusLabels: Record<TripStatus, string> = {
  upcoming: "Próxima",
  ongoing: "Em andamento",
  completed: "Concluída",
};

export function TripCard({ trip }: TripCardProps) {
  const titleId = `trip-title-${trip.id}`;

  return (
    <article aria-labelledby={titleId} className="h-full">
      <Link
        href={"/viagens/" + trip.id}
        aria-label={"Entrar na viagem: " + trip.name}
        className="group block h-full cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
          <CardHeader className="gap-3">
            <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {statusLabels[trip.status]}
            </span>

            <h2 id={titleId} className="text-lg font-semibold">
              {trip.name}
            </h2>

            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span>{trip.destination}</span>
            </p>
          </CardHeader>

          <CardContent>
            <div className="flex items-start gap-2">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Período da viagem</p>
                <p>
                  <time dateTime={trip.startDate}>{formatTripDate(trip.startDate)}</time>
                  {" - "}
                  <time dateTime={trip.endDate}>{formatTripDate(trip.endDate)}</time>
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto flex-wrap justify-between gap-3 border-t text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <UserRound aria-hidden="true" className="size-4 shrink-0" />
              <span>
                {trip.participantCount}{" "}
                {trip.participantCount === 1 ? "participante" : "participantes"}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              Entrar na viagem <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </CardFooter>
        </Card>
      </Link>
    </article>
  );
}
