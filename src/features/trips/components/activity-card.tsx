"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import type { Activity } from "../model/activity";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ActivityCard({
  activity: a,
  isOwner,
  viewerId,
  disabled,
  onEdit,
  onVote,
  onConfirm,
  onRemove,
  children,
}: {
  activity: Activity;
  isOwner: boolean;
  viewerId: string;
  disabled: boolean;
  onEdit: () => void;
  onVote: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onRemove: () => Promise<void>;
  children?: ReactNode;
}) {
  const canManage = isOwner || (a.createdBy === viewerId && a.status === "proposed");
  return (
    <article className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <span className="text-xs font-medium text-primary">
            {a.status === "confirmed" ? "Confirmado" : "Em votação"}
          </span>
          <h4 className="text-lg font-semibold break-words">{a.title}</h4>
          <p className="text-sm text-muted-foreground break-words">
            {a.startTime ?? "Horário a combinar"}
            {a.location ? " · " + a.location : ""}
          </p>
        </div>
        <p className="text-sm font-medium">{money.format(a.estimatedCost)} / pessoa</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">
          {a.votes} {a.votes === 1 ? "voto" : "votos"}
        </span>
        {a.status === "proposed" && (
          <Button
            variant={a.votedByMe ? "secondary" : "outline"}
            disabled={disabled}
            aria-pressed={a.votedByMe}
            onClick={onVote}
          >
            {a.votedByMe ? "Retirar voto" : "Votar"}
          </Button>
        )}
        {isOwner && (
          <Button variant="outline" disabled={disabled} onClick={onConfirm}>
            {a.status === "confirmed" ? "Reabrir votação" : "Confirmar passeio"}
          </Button>
        )}
        {canManage && (
          <>
            <Button
              id={"edit-activity-" + a.id}
              variant="outline"
              disabled={disabled}
              onClick={onEdit}
            >
              Editar passeio
            </Button>
            <ConfirmButton
              label="Remover passeio"
              message={"Remover “" + a.title + "” e seus votos?"}
              disabled={disabled}
              onConfirm={onRemove}
            />
          </>
        )}
      </div>
      {children}
    </article>
  );
}
