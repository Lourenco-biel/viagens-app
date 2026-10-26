import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { TripDetails } from "@/features/trips/components/trip-details";

export const metadata = { title: "Roteiro da viagem" };
export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <Link className="text-sm underline underline-offset-4" href="/viagens">
        Voltar para suas viagens
      </Link>
      <TripDetails id={id} />
    </main>
  );
}
