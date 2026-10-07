import type { Metadata } from "next";
import Link from "next/link";

import { CreateTripForm } from "@/features/trips/components/create-trip-form";

export const metadata: Metadata = {
  title: "Nova viagem",
  description: "Planeje uma nova viagem e revise seus dados.",
};

export default function NewTripPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <Link
        href="/viagens"
        className="rounded-sm text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Voltar para suas viagens
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Nova viagem
        </h1>

        <p className="text-muted-foreground">
          Escolha o destino e o período para começar seu planejamento.
        </p>
      </header>

      <CreateTripForm />
    </main>
  );
}