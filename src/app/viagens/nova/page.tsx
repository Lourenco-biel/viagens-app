import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";

import { NewTrip } from "@/features/trips/components/save-trip";

export const metadata: Metadata = {
  title: "Nova viagem",
  description: "Planeje uma nova viagem e revise seus dados.",
};

export default function NewTripPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <BackLink href="/viagens" label="Voltar para suas viagens" />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Nova viagem</h1>

        <p className="text-muted-foreground">
          Escolha o destino e o período para começar seu planejamento.
        </p>
      </header>

      <NewTrip />
    </main>
  );
}
