"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmButton } from "@/components/confirm-button";
import { CREATE_INVITE, REMOVE_MEMBER, TRIP } from "../graphql/documents";
import type { TripDetail } from "../model/trip-detail";
import { errorMessage } from "@/lib/graphql/error-message";

export function TripMembers({ trip, viewerId }: { trip: TripDetail; viewerId: string }) {
  const router = useRouter();
  const [createInvite, { loading: inviting }] = useMutation(CREATE_INVITE);
  const [remove, { loading: removing }] = useMutation(REMOVE_MEMBER);
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setError("");
    setCopied(false);
    try {
      const { data } = await createInvite({ variables: { tripId: trip.id } });
      if (data)
        setInvite({
          url: window.location.origin + "/convites/" + data.createInvite.token,
          expiresAt: data.createInvite.expiresAt,
        });
    } catch (error) {
      setError(errorMessage(error));
    }
  }

  async function removeMember(userId: string) {
    setError("");
    try {
      await remove({
        variables: { tripId: trip.id, userId },
        refetchQueries: userId === viewerId ? [] : [{ query: TRIP, variables: { id: trip.id } }],
        awaitRefetchQueries: true,
        update(cache) {
          cache.evict({ fieldName: "trips" });
          if (userId === viewerId)
            cache.evict({ id: cache.identify({ __typename: "Trip", id: trip.id }) });
        },
      });
      if (userId === viewerId) router.replace("/viagens");
    } catch (error) {
      setError(errorMessage(error));
    }
  }

  return (
    <section aria-labelledby="members-heading" className="space-y-5 rounded-xl border bg-card p-5">
      <h2 id="members-heading" className="text-xl font-semibold">
        Participantes <span className="text-muted-foreground">({trip.members.length})</span>
      </h2>
      <ul className="space-y-4">
        {trip.members.map((member) => (
          <li key={member.userId} className="space-y-2">
            <div>
              <p className="font-medium break-words">
                {member.displayName}
                {member.userId === viewerId && " (você)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.isOwner ? "Organizador" : "Participante"}
              </p>
            </div>
            {!member.isOwner && (trip.isOwner || member.userId === viewerId) && (
              <ConfirmButton
                disabled={removing}
                label={member.userId === viewerId ? "Sair da viagem" : "Remover participante"}
                message="O participante perderá o acesso e seus votos serão removidos. Seus passeios permanecerão no roteiro."
                onConfirm={() => removeMember(member.userId)}
              />
            )}
          </li>
        ))}
      </ul>
      {trip.isOwner && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            O convite permite entrar nesta viagem por 7 dias. Compartilhe apenas com quem vai
            participar. Gerar outro invalida o anterior.
          </p>
          <Button variant="outline" disabled={inviting} onClick={generate}>
            {inviting ? "Gerando..." : invite ? "Gerar novo convite" : "Convidar pessoas"}
          </Button>
          {invite && (
            <div className="space-y-2">
              <label htmlFor="invite-link" className="text-sm font-medium">
                Link do convite
              </label>
              <Input
                id="invite-link"
                readOnly
                value={invite.url}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(invite.url);
                    setCopied(true);
                  } catch {
                    setError("Selecione o link acima para copiar manualmente.");
                  }
                }}
              >
                Copiar link
              </Button>
              {copied && (
                <p role="status" className="text-sm">
                  Link copiado.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Válido até {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}.
              </p>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
