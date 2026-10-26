"use client";

import { ErrorState } from "@/components/feedback";

export default function TripsError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <ErrorState message="Não foi possível abrir esta página." retry={reset} />
    </main>
  );
}
