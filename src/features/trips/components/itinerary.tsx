"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { ErrorState } from "@/components/feedback";
import {
  ADD_ACTIVITY,
  DELETE_ACTIVITY,
  SET_ACTIVITY_STATUS,
  VOTE_ACTIVITY,
} from "../graphql/documents";
import type { TripDetail } from "../model/trip-detail";
import { ActivityForm } from "./activity-form";
import { formatTripDate } from "../lib/format-trip-date";
import { errorMessage } from "@/lib/graphql/error-message";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Itinerary({ trip, viewerId }: { trip: TripDetail; viewerId: string }) {
  const [add] = useMutation(ADD_ACTIVITY);
  const [remove] = useMutation(DELETE_ACTIVITY);
  const [confirm] = useMutation(SET_ACTIVITY_STATUS);
  const [vote] = useMutation(VOTE_ACTIVITY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const days = [...new Set(trip.activities.map((a) => a.day))].sort();
  const total = trip.activities
    .filter((a) => a.status === "confirmed")
    .reduce((sum, a) => sum + a.estimatedCost, 0);

  async function run(action: () => Promise<unknown>) {
    setPending(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="roteiro-heading" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="roteiro-heading" className="text-2xl font-semibold">
            Roteiro
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vote nas sugestões. O organizador confirma o que entra no roteiro.
          </p>
        </div>
        <div className="rounded-xl bg-muted px-4 py-3">
          <p className="text-xs text-muted-foreground">Passeios confirmados · por pessoa</p>
          <p className="font-semibold">{money.format(total)}</p>
        </div>
      </div>
      {error && <ErrorState message={error} />}
      {!days.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          O roteiro começa com uma ideia. Sugira o primeiro passeio abaixo.
        </p>
      )}
      {days.map((day) => (
        <section key={day} aria-label={formatTripDate(day)} className="space-y-3">
          <h3 className="font-semibold">
            <time dateTime={day}>{formatTripDate(day)}</time>
          </h3>
          {trip.activities
            .filter((a) => a.day === day)
            .map((a) => (
              <article key={a.id} className="space-y-4 rounded-xl border bg-card p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-primary">
                      {a.status === "confirmed" ? "Confirmado" : "Em votação"}
                    </span>
                    <h4 className="text-lg font-semibold">{a.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {a.startTime ?? "Horário a combinar"}
                      {a.location ? " · " + a.location : ""}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{money.format(a.estimatedCost)} / pessoa</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm text-muted-foreground">
                    {a.votes} {a.votes === 1 ? "voto" : "votos"}
                  </span>
                  {a.status === "proposed" && (
                    <Button
                      variant={a.votedByMe ? "secondary" : "outline"}
                      disabled={pending}
                      aria-pressed={a.votedByMe}
                      onClick={() =>
                        run(() => vote({ variables: { id: a.id, voted: !a.votedByMe } }))
                      }
                    >
                      {a.votedByMe ? "Retirar voto" : "Votar"}
                    </Button>
                  )}
                  {trip.isOwner && (
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          confirm({ variables: { id: a.id, confirmed: a.status !== "confirmed" } }),
                        )
                      }
                    >
                      {a.status === "confirmed" ? "Reabrir votação" : "Confirmar passeio"}
                    </Button>
                  )}
                  {(trip.isOwner || (a.createdBy === viewerId && a.status === "proposed")) && (
                    <ConfirmButton
                      label="Remover passeio"
                      message={"Remover “" + a.title + "” e seus votos?"}
                      disabled={pending}
                      onConfirm={() => run(() => remove({ variables: { id: a.id } }))}
                    />
                  )}
                </div>
              </article>
            ))}
        </section>
      ))}
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <h3 className="text-lg font-semibold">Sugerir passeio</h3>
        <ActivityForm
          startDate={trip.startDate}
          endDate={trip.endDate}
          onSaveAction={async (input) => {
            await add({ variables: { tripId: trip.id, input } });
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Os custos são estimativas informadas pelo grupo, em reais. Não incluem hospedagem,
        transporte ou reservas.
      </p>
    </section>
  );
}
