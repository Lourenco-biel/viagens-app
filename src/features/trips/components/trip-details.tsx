"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { TRIP, DELETE_TRIP } from "../graphql/documents";
import { ErrorState, LoadingState } from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { formatTripDate } from "../lib/format-trip-date";
import { errorMessage } from "@/lib/graphql/error-message";
import { Itinerary } from "./itinerary";
import { TripMembers } from "./trip-members";

export function TripDetails({ id }: { id: string }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const { data, loading, error, refetch } = useQuery(TRIP, {
    variables: { id },
    pollInterval: 30000,
    skip: closing,
  });
  const [remove, { loading: removing }] = useMutation(DELETE_TRIP);
  const [actionError, setActionError] = useState("");

  async function deleteTrip() {
    setActionError("");
    setClosing(true);
    try {
      await remove({
        variables: { id },
        update(cache) {
          cache.evict({ fieldName: "trips" });
          cache.evict({ id: cache.identify({ __typename: "Trip", id }) });
          cache.gc();
        },
      });
      router.replace("/viagens");
    } catch (error) {
      setClosing(false);
      setActionError(errorMessage(error));
    }
  }
  if (closing) return <LoadingState label="Excluindo viagem..." />;
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        retry={() => {
          void refetch();
        }}
      />
    );
  if (loading && !data) return <LoadingState label="Carregando a viagem..." />;
  if (!data) return null;
  const { trip, viewerId } = data;

  return (
    <div className="space-y-8">
      <header className="space-y-4 rounded-2xl border bg-card p-6 sm:p-8">
        <p className="text-sm font-medium text-primary">
          {trip.status === "upcoming"
            ? "A próxima história"
            : trip.status === "ongoing"
              ? "A viagem está acontecendo"
              : "Uma história para guardar"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight break-words">{trip.name}</h1>
        <p className="text-lg text-muted-foreground">{trip.destination}</p>
        <p>
          {formatTripDate(trip.startDate)} — {formatTripDate(trip.endDate)}
        </p>
        {trip.isOwner && (
          <div className="flex flex-wrap items-start gap-3">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={"/viagens/" + id + "/editar"}
            >
              Editar viagem
            </Link>
            <ConfirmButton
              label="Excluir viagem"
              message="Excluir esta viagem, todos os passeios, convites e votos? Esta ação não pode ser desfeita."
              disabled={removing}
              onConfirm={deleteTrip}
            />
          </div>
        )}
        {actionError && <ErrorState message={actionError} />}
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Itinerary trip={trip} viewerId={viewerId} />
        <TripMembers trip={trip} viewerId={viewerId} />
      </div>
    </div>
  );
}
