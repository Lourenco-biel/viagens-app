"use client";

import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorMessage } from "@/lib/graphql/error-message";
import { tripBudgetSchema, type TripBudgetInput } from "../model/trip-budget";

export function BudgetDialog({
  initialValue,
  onSaveAction,
  onCloseAction,
  returnFocusId,
  refreshError,
}: {
  initialValue: string | null;
  onSaveAction: (input: TripBudgetInput) => Promise<void>;
  onCloseAction: () => void;
  returnFocusId: string;
  refreshError?: string;
}) {
  const [initial] = useState(initialValue);
  const [value, setValue] = useState(initialValue?.replace(".", ",") ?? "");
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  function close() {
    if (sending.current) return;
    if (
      value !== (initial?.replace(".", ",") ?? "") &&
      !window.confirm("Descartar as alterações do orçamento?")
    )
      return;
    onCloseAction();
  }
  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        if (!open) {
          details.cancel();
          close();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
        initialFocus={input}
        finalFocus={() => document.getElementById(returnFocusId)}
      >
        <DialogHeader className="pr-10">
          <DialogTitle>{initial === null ? "Definir orçamento" : "Editar orçamento"}</DialogTitle>
          <DialogDescription>
            Estimativa por pessoa, em reais, somente para passeios. Zero indica planejamento com
            passeios gratuitos.
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          disabled={pending}
          aria-label="Fechar"
          render={<Button variant="ghost" className="absolute top-3 right-3 size-11" />}
        >
          <X aria-hidden="true" className="size-5" />
        </DialogClose>
        <form
          className="space-y-4"
          noValidate
          aria-busy={pending}
          onSubmit={async (event) => {
            event.preventDefault();
            if (sending.current) return;
            const result = tripBudgetSchema.safeParse({
              budgetPerPerson: value.trim().replace(",", "."),
            });
            setError("");
            if (!result.success) {
              setFieldError(result.error.issues[0].message);
              input.current?.focus();
              return;
            }
            setFieldError("");
            sending.current = true;
            setPending(true);
            try {
              await onSaveAction(result.data);
              onCloseAction();
            } catch (cause) {
              setError(errorMessage(cause));
            } finally {
              sending.current = false;
              setPending(false);
            }
          }}
        >
          <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium">
              Orçamento estimado por pessoa (R$)
            </label>
            <Input
              ref={input}
              id={id}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={value}
              disabled={pending}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={`${id}-hint${fieldError ? ` ${id}-error` : ""}`}
              onChange={(event) => {
                setValue(event.target.value);
                setFieldError("");
              }}
            />
            <p id={`${id}-hint`} className="text-sm text-muted-foreground">
              Use até duas casas decimais, sem separador de milhar.
            </p>
            {fieldError && (
              <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                {fieldError}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {refreshError && (
            <p role="alert" className="text-sm text-destructive">
              {refreshError}
            </p>
          )}
          {pending && (
            <p role="status" className="text-sm">
              Salvando orçamento…
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar orçamento"}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
