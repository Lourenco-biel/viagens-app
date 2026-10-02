import type { TripSummary } from "../model/trip";
import { TripCard } from "./trip-card";

type TripListProps = Readonly<{
  trips: TripSummary[];
}>;

export function TripList({ trips }: TripListProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {trips.map((trip) => (
        <li key={trip.id} className="h-full">
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  );
}
