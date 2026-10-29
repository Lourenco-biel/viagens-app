"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { ErrorState } from "@/components/feedback";
import {
  ADD_ACTIVITY,
  DELETE_ACTIVITY,
  SET_ACTIVITY_STATUS,
  VOTE_ACTIVITY,
  UPDATE_ACTIVITY,
  TRIP,
} from "../graphql/documents";
import type { TripDetail } from "../model/trip-detail";
import type { Activity } from "../model/activity";
import { ActivityForm } from "./activity-form";
import { ActivityCard } from "./activity-card";
import { formatTripDate } from "../lib/format-trip-date";
import { sameActivityValues } from "../lib/activity-values";
import { errorMessage } from "@/lib/graphql/error-message";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Itinerary({ trip, viewerId }: { trip: TripDetail; viewerId: string }) {
  const client = useApolloClient();
  const [add] = useMutation(ADD_ACTIVITY);
  const [remove] = useMutation(DELETE_ACTIVITY);
  const [confirm] = useMutation(SET_ACTIVITY_STATUS);
  const [vote] = useMutation(VOTE_ACTIVITY);
  const [update] = useMutation(UPDATE_ACTIVITY);
  const [editing, setEditing] = useState<Activity | null>(null);
  const focusAfterClose = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!editing && focusAfterClose.current) {
      document.getElementById("edit-activity-" + focusAfterClose.current)?.focus();
      focusAfterClose.current = null;
    }
  }, [editing]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const activities = [...trip.activities];
  if (editing && !activities.some((a) => a.id === editing.id)) activities.push(editing);
  activities.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") ||
      a.id.localeCompare(b.id),
  );
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

  function closeEditor(id: string) {
    focusAfterClose.current = id;
    setEditing(null);
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
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      {!activities.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          O roteiro começa com uma ideia. Sugira o primeiro passeio abaixo.
        </p>
      )}
      {activities.map((a, index) => (
        <Fragment key={a.id}>
          {activities[index - 1]?.day !== a.day && (
            <h3 className="font-semibold">
              <time dateTime={a.day}>{formatTripDate(a.day)}</time>
            </h3>
          )}
          <ActivityCard
            activity={a}
            isOwner={trip.isOwner}
            viewerId={viewerId}
            disabled={pending || Boolean(editing)}
            onEdit={() => {
              setEditing({ ...a });
              setMessage("");
              setError("");
            }}
            onVote={() => run(() => vote({ variables: { id: a.id, voted: !a.votedByMe } }))}
            onConfirm={() =>
              run(() => confirm({ variables: { id: a.id, confirmed: a.status !== "confirmed" } }))
            }
            onRemove={() => run(() => remove({ variables: { id: a.id } }))}
          >
            {editing?.id === a.id && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Ao alterar este passeio, os votos serão zerados.
                  {a.status === "confirmed" &&
                    " Ele voltará para votação e sairá do total de custos confirmados."}
                </p>
                <ActivityForm
                  key={editing.id + ":" + editing.version}
                  initialValues={editing}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                  confirmSave={() =>
                    !(a.votes > 0 || a.status === "confirmed") ||
                    window.confirm(
                      "Salvar as alterações e zerar os votos deste passeio?" +
                        (a.status === "confirmed"
                          ? " Ele voltará para votação e sairá do total de custos confirmados."
                          : ""),
                    )
                  }
                  onCancelAction={() => closeEditor(a.id)}
                  onReloadAction={async () => {
                    const result = await client.query({
                      query: TRIP,
                      variables: { id: trip.id },
                      fetchPolicy: "network-only",
                    });
                    const current = result.data?.trip.activities.find((item) => item.id === a.id);
                    if (!current) throw new Error("Passeio indisponível");
                    setEditing({ ...current });
                  }}
                  onSaveAction={async (input) => {
                    await update({
                      variables: { id: a.id, input, expectedVersion: editing.version },
                    });
                    setMessage(
                      sameActivityValues(editing, input)
                        ? "Nenhuma alteração para salvar."
                        : "Passeio atualizado. A votação foi reiniciada.",
                    );
                    closeEditor(a.id);
                  }}
                />
              </div>
            )}
          </ActivityCard>
        </Fragment>
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
