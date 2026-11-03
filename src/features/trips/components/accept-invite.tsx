"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InviteDialog } from "./invite-dialog";
import { ACCEPT_INVITE } from "../graphql/documents";
import { errorMessage } from "@/lib/graphql/error-message";
import { useHydrated } from "@/hooks/use-hydrated";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [accept, { loading }] = useMutation(ACCEPT_INVITE);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function join() {
    if (loading || leaving) return;
    setError("");
    try {
      const { data } = await accept({
        variables: { token },
        update(cache) {
          cache.evict({ fieldName: "trips" });
        },
      });
      if (!data) throw new Error("Convite sem resposta");
      setLeaving(true);
      router.replace("/viagens/" + data.acceptInvite.id);
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  if (!hydrated) return null;
  return (
    <InviteDialog
      pending={loading || leaving}
      error={error}
      onAcceptAction={() => {
        void join();
      }}
      onDismissAction={() => {
        if (loading || leaving) return;
        setLeaving(true);
        router.replace("/viagens");
      }}
    />
  );
}
