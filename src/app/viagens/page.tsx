import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TripsOverview } from "@/features/trips/components/trips-overview";
import { parseTripFilters, type TripSearchParams } from "@/features/trips/lib/trip-filters";

export const metadata = { title: "Suas viagens" };

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<TripSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseTripFilters(params);
  const rawPage = Number(params.page);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 8334) : 1;
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Suas viagens</h1>
          <p className="text-muted-foreground">
            Seus próximos destinos e as histórias que você já viveu.
          </p>
        </div>
        <Link href="/viagens/nova" className={buttonVariants()}>
          <Plus aria-hidden="true" />
          Nova viagem
        </Link>
      </header>
      <TripsOverview filters={filters} page={page} />
    </main>
  );
}
