"use client";

import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { errorMessage } from "@/lib/graphql/error-message";
import type { TripMember } from "../model/activity";

export function RemoveMemberDialog({
  member,
  onRemoveAction,
  onCloseAction,
  onRemovedAction,
}: {
  member: TripMember;
  onRemoveAction: (userId: string) => Promise<void>;
  onCloseAction: () => void;
  onRemovedAction: () => void;
}) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await onRemoveAction(member.userId);
      onRemovedAction();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          if (!pending) onCloseAction();
        }
      }}
    >
      <AlertDialogContent
        initialFocus={cancelButton}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
        finalFocus={() =>
          document.getElementById("member-actions-" + member.userId) ??
          document.getElementById("members-heading")
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">
            Remover {member.displayName} da viagem?
          </AlertDialogTitle>
          <AlertDialogDescription>
            O participante perderá o acesso e seus votos serão removidos. Seus passeios permanecerão
            no roteiro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelButton} disabled={pending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => {
              void confirm();
            }}
          >
            {pending ? "Removendo..." : "Remover participante"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
