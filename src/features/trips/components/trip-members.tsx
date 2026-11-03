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
import type { TripMember } from "../model/activity";
import { MemberActions } from "./member-actions";
import { RemoveMemberDialog } from "./remove-member-dialog";

export function TripMembers({ trip, viewerId }: { trip: TripDetail; viewerId: string }) {
  const router = useRouter();
  const [createInvite, { loading: inviting }] = useMutation(CREATE_INVITE);
  const [remove, { loading: removing }] = useMutation(REMOVE_MEMBER);
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TripMember | null>(null);
  const [message, setMessage] = useState("");

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
  }

  return (
    <section aria-labelledby="members-heading" className="space-y-5 rounded-xl border bg-card p-5">
      <h2
        id="members-heading"
        tabIndex={-1}
        className="rounded-sm text-xl font-semibold focus-visible:outline-2 focus-visible:outline-ring"
      >
        Participantes <span className="text-muted-foreground">({trip.members.length})</span>
      </h2>
      <ul className="space-y-4">
        {trip.members.map((member) => (
          <li key={member.userId} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">
                  {member.displayName}
                  {member.userId === viewerId && " (você)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {member.isOwner ? "Organizador" : "Participante"}
                </p>
              </div>
              {trip.isOwner && !member.isOwner && (
                <MemberActions
                  member={member}
                  disabled={removing || Boolean(selectedMember)}
                  onRemoveAction={() => {
                    setSelectedMember({ ...member });
                    setMessage("");
                  }}
                />
              )}
            </div>
            {!member.isOwner && member.userId === viewerId && (
              <ConfirmButton
                disabled={removing}
                label="Sair da viagem"
                message="O participante perderá o acesso e seus votos serão removidos. Seus passeios permanecerão no roteiro."
                onConfirm={async () => {
                  setError("");
                  try {
                    await removeMember(member.userId);
                  } catch (error) {
                    setError(errorMessage(error));
                  }
                }}
              />
            )}
          </li>
        ))}
      </ul>
      {selectedMember && (
        <RemoveMemberDialog
          member={selectedMember}
          onRemoveAction={removeMember}
          onCloseAction={() => setSelectedMember(null)}
          onRemovedAction={() => {
            setSelectedMember(null);
            setMessage("Participante removido.");
          }}
        />
      )}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
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
