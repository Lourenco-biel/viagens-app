"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InviteDialog({
  pending,
  error,
  onAcceptAction,
  onDismissAction,
}: {
  pending: boolean;
  error: string;
  onAcceptAction: () => void;
  onDismissAction: () => void;
}) {
  const acceptButton = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          if (!pending) onDismissAction();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        initialFocus={acceptButton}
        finalFocus={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-semibold">Vamos viajar juntos?</DialogTitle>
          <DialogDescription>
            Ao aceitar, você passa a participar da viagem e pode sugerir passeios e votar. Seu nome
            ficará visível para o grupo.
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          disabled={pending}
          aria-label="Fechar convite"
          render={<Button variant="ghost" className="absolute top-3 right-3 size-11" />}
        >
          <X aria-hidden="true" className="size-5" />
        </DialogClose>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onDismissAction}>
            Agora não
          </Button>
          <Button ref={acceptButton} disabled={pending} onClick={onAcceptAction}>
            {pending ? "Entrando..." : "Aceitar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
