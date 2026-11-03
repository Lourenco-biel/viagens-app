"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Activity, ActivityInput } from "../model/activity";
import { ActivityForm } from "./activity-form";

export function ActivityDialog({
  activity,
  currentActivity = activity,
  startDate,
  endDate,
  onSaveAction,
  onReloadAction,
  onCloseAction,
}: {
  activity?: Activity;
  currentActivity?: Activity;
  startDate: string;
  endDate: string;
  onSaveAction: (input: ActivityInput) => Promise<void>;
  onReloadAction?: () => Promise<void>;
  onCloseAction: () => void;
}) {
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const title = activity ? "Editar passeio" : "Sugerir passeio";

  function requestClose() {
    if (pending) return;
    if (dirty && !window.confirm("Descartar as alterações deste passeio?")) return;
    onCloseAction();
  }

  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          requestClose();
        }
      }}
    >
      <DialogContent
        ref={content}
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-[640px]"
        initialFocus={() => content.current?.querySelector("input") ?? true}
        finalFocus={() =>
          document.getElementById(activity ? "edit-activity-" + activity.id : "suggest-activity") ??
          document.getElementById("suggest-activity")
        }
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription>
            {activity
              ? "Ajuste os detalhes do passeio para o grupo."
              : "Compartilhe uma ideia para o roteiro da viagem."}
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          disabled={pending}
          aria-label="Fechar"
          render={<Button variant="ghost" className="absolute top-3 right-3 size-11" />}
        >
          <X aria-hidden="true" className="size-5" />
        </DialogClose>
        {activity && (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Ao alterar este passeio, os votos serão zerados.
            {currentActivity?.status === "confirmed" &&
              " Ele voltará para votação e sairá do total de custos confirmados."}
          </p>
        )}
        <ActivityForm
          key={activity ? activity.id + ":" + activity.version : "new"}
          initialValues={activity}
          startDate={startDate}
          endDate={endDate}
          onDirtyChange={setDirty}
          onPendingChange={setPending}
          onCancelAction={requestClose}
          onSaveAction={onSaveAction}
          onReloadAction={
            onReloadAction &&
            (async () => {
              await onReloadAction();
              setDirty(false);
            })
          }
          confirmSave={() =>
            !(
              currentActivity &&
              (currentActivity.votes > 0 || currentActivity.status === "confirmed")
            ) ||
            window.confirm(
              "Salvar as alterações e zerar os votos deste passeio?" +
                (currentActivity?.status === "confirmed"
                  ? " Ele voltará para votação e sairá do total de custos confirmados."
                  : ""),
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}
