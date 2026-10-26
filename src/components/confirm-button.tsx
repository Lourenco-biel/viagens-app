"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export function ConfirmButton({
  label,
  message,
  onConfirm,
  disabled = false,
}: {
  label: string;
  message: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming)
    return (
      <Button variant="destructive" disabled={disabled} onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  return (
    <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
      <p className="text-sm">{message}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          disabled={disabled}
          onClick={async () => {
            await onConfirm();
            setConfirming(false);
          }}
        >
          Confirmar
        </Button>
        <Button variant="outline" disabled={disabled} onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
