"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { CREATE_TRIP, UPDATE_TRIP, TRIP } from "../graphql/documents";
import { CreateTripForm } from "./create-trip-form";
import type { CreateTripInput } from "../model/create-trip";
import { LoadingState, ErrorState } from "@/components/feedback";
import { errorMessage } from "@/lib/graphql/error-message";

export function NewTrip() {
  const router = useRouter();
  const [create] = useMutation(CREATE_TRIP);
  async function save(input: CreateTripInput) {
    const { data } = await create({
      variables: { input },
      update(cache) {
        cache.evict({ fieldName: "trips" });
      },
    });
    if (data) router.push("/viagens/" + data.createTrip.id);
  }
  return <CreateTripForm onSaveAction={save} />;
}

export function EditTrip({ id }: { id: string }) {
  const router = useRouter();
  const { data, error, loading, refetch } = useQuery(TRIP, { variables: { id } });
  const [update] = useMutation(UPDATE_TRIP);
  async function save(input: CreateTripInput) {
    await update({
      variables: { id, input },
      update(cache) {
        cache.evict({ fieldName: "trips" });
      },
    });
    router.push("/viagens/" + id);
  }
  if (error)
    return (
      <ErrorState
        message={errorMessage(error)}
        retry={() => {
          void refetch();
        }}
      />
    );
  if (loading && !data) return <LoadingState />;
  if (!data?.trip.isOwner)
    return <ErrorState message="Somente o organizador pode editar esta viagem." />;
  return <CreateTripForm key={id} initialValues={data.trip} onSaveAction={save} />;
}
