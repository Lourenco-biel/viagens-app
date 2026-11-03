"use client";

import { useRef } from "react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TripMember } from "../model/activity";

export function MemberActions({
  member,
  disabled,
  onRemoveAction,
}: {
  member: TripMember;
  disabled: boolean;
  onRemoveAction: () => void;
}) {
  const openingDialog = useRef(false);
  const triggerId = "member-actions-" + member.userId;
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) openingDialog.current = false;
      }}
    >
      <DropdownMenuTrigger
        id={triggerId}
        aria-label={"Ações de " + member.displayName}
        disabled={disabled}
        render={<Button variant="ghost" className="size-11 shrink-0" />}
      >
        <EllipsisVertical aria-hidden="true" className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        finalFocus={() => (openingDialog.current ? false : document.getElementById(triggerId))}
      >
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            openingDialog.current = true;
            onRemoveAction();
          }}
        >
          <Trash2 aria-hidden="true" /> Remover participante
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
