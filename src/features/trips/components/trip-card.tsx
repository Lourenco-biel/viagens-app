import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { formatTripDate } from "../lib/format-trip-date";
import type { TripSummary, TripStatus } from "../model/trip";
import { CalendarDays, MapPin, UserRound } from "lucide-react";

type TripCardProps = Readonly<{
  trip: TripSummary;
}>;

const statusLabels: Record<TripStatus, string> = {
  upcoming: "Próxima",
  ongoing: "Em andamento",
  completed: "Concluído",
};

export function TripCard({ trip }: TripCardProps) {
  const titleId = `trip-title-${trip.id}`;

  return (
    <article aria-labelledby={titleId} className="h-full">
      <Card className="h-full">
        <CardHeader className="gap-3">
          <span className="w-fit rouded-full bg-muted px-3 py-1 text-xs front-medium">
            {statusLabels[trip.status]}
          </span>

          <h2 id={titleId} className="text-lg fonrt-semibold">
            {trip.name}
          </h2>

          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin arial-hidden="true" className="size-4 shrink-0" />
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
              <p className="mb-1 text-xs text-foreground">Periodo da viagem</p>
              <p>
                <time dateTime={trip.startDate}>
                  {formatTripDate(trip.startDate)}
                </time>
                {" - "}
                <time dateTime={trip.endDate}>
                  {formatTripDate(trip.endDate)}
                </time>
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-auto gap-2 border-t text-muted-foreground">
          <UserRound aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {trip.participantCount}{" "}
            {trip.participantCount === 1 ? "participante" : "participantes"}
          </span>
        </CardFooter>
      </Card>
    </article>
  );
}
