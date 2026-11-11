"use client";

import { Fragment, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ActivityDialog } from "./activity-dialog";
import { ActivityCard } from "./activity-card";
import { formatTripDate } from "../lib/format-trip-date";
import { sameActivityValues } from "../lib/activity-values";
import { errorMessage } from "@/lib/graphql/error-message";
import { TripBudget } from "./trip-budget";

export function Itinerary({
  trip,
  viewerId,
  refreshError,
}: {
  trip: TripDetail;
  viewerId: string;
  refreshError?: string;
}) {
  const client = useApolloClient();
  const [add] = useMutation(ADD_ACTIVITY);
  const [remove] = useMutation(DELETE_ACTIVITY);
  const [confirm] = useMutation(SET_ACTIVITY_STATUS);
  const [vote] = useMutation(VOTE_ACTIVITY);
  const [update] = useMutation(UPDATE_ACTIVITY);
  const [editor, setEditor] = useState<{ activity?: Activity } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const editing = editor?.activity;
  const activities = [...trip.activities].sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") ||
      a.id.localeCompare(b.id),
  );

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

  function openEditor(activity?: Activity) {
    setEditor({ activity: activity && { ...activity } });
    setMessage("");
    setError("");
  }

  return (
    <section aria-labelledby="roteiro-heading" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="roteiro-heading" className="text-2xl font-semibold">
            Roteiro
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vote nas sugestões. O organizador confirma o que entra no roteiro.
          </p>
        </div>
        <Button
          id="suggest-activity"
          className="min-h-11"
          disabled={pending || Boolean(editor)}
          onClick={() => openEditor()}
        >
          <Plus aria-hidden="true" /> Sugerir passeio
        </Button>
      </div>
      <TripBudget trip={trip} refreshError={refreshError} />
      {error && <ErrorState message={error} />}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      {!activities.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          O roteiro começa com uma ideia. Use “Sugerir passeio” para adicionar a primeira.
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
            disabled={pending || Boolean(editor)}
            onEdit={() => openEditor(a)}
            onVote={() => run(() => vote({ variables: { id: a.id, voted: !a.votedByMe } }))}
            onConfirm={() =>
              run(() => confirm({ variables: { id: a.id, confirmed: a.status !== "confirmed" } }))
            }
            onRemove={() => run(() => remove({ variables: { id: a.id } }))}
          />
        </Fragment>
      ))}
      {editor && (
        <ActivityDialog
          activity={editing}
          currentActivity={trip.activities.find((a) => a.id === editing?.id)}
          startDate={trip.startDate}
          endDate={trip.endDate}
          onCloseAction={() => setEditor(null)}
          onReloadAction={
            editing &&
            (async () => {
              const result = await client.query({
                query: TRIP,
                variables: { id: trip.id },
                fetchPolicy: "network-only",
              });
              const current = result.data?.trip.activities.find((a) => a.id === editing.id);
              if (!current)
                throw new CombinedGraphQLErrors({
                  errors: [
                    {
                      message: "Passeio não encontrado ou sem acesso.",
                      extensions: { code: "NOT_FOUND" },
                    },
                  ],
                });
              setEditor({ activity: { ...current } });
            })
          }
          onSaveAction={async (input) => {
            if (editing) {
              await update({
                variables: { id: editing.id, input, expectedVersion: editing.version },
              });
              setMessage(
                sameActivityValues(editing, input)
                  ? "Nenhuma alteração para salvar."
                  : "Passeio atualizado. A votação foi reiniciada.",
              );
            } else {
              await add({ variables: { tripId: trip.id, input } });
              setMessage("Passeio adicionado às sugestões.");
            }
            setEditor(null);
          }}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Os custos são estimativas informadas pelo grupo, em reais. Não incluem hospedagem,
        transporte ou reservas.
      </p>
    </section>
  );
}
