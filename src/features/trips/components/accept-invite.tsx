"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ACCEPT_INVITE } from "../graphql/documents";
import { errorMessage } from "@/lib/graphql/error-message";
import { useHydrated } from "@/hooks/use-hydrated";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [accept, { loading }] = useMutation(ACCEPT_INVITE);
  const [error, setError] = useState("");
  async function join() {
    setError("");
    try {
      const { data } = await accept({
        variables: { token },
        update(cache) {
          cache.evict({ fieldName: "trips" });
        },
      });
      if (data) router.replace("/viagens/" + data.acceptInvite.id);
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground">
        Ao aceitar, você passa a participar da viagem e pode sugerir passeios e votar. Seu nome
        ficará visível para o grupo.
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Button disabled={loading || !hydrated} onClick={join}>
        {loading ? "Entrando..." : "Aceitar convite"}
      </Button>
    </div>
  );
}
