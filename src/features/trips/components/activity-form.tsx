"use client";

import { useId, useState, type SubmitEvent } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { activitySchema, type ActivityInput } from "../model/activity";
import { errorMessage } from "@/lib/graphql/error-message";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { sameActivityValues } from "../lib/activity-values";

function readValues(form: HTMLFormElement): ActivityInput {
  const data = new FormData(form);
  return {
    title: String(data.get("title") ?? ""),
    day: String(data.get("day") ?? ""),
    startTime: String(data.get("startTime") ?? "") || null,
    location: String(data.get("location") ?? ""),
    estimatedCost: data.get("estimatedCost") === "" ? NaN : Number(data.get("estimatedCost")),
  };
}

export function ActivityForm({
  startDate,
  endDate,
  onSaveAction,
  initialValues,
  confirmSave,
  onCancelAction,
  onReloadAction,
  onDirtyChange,
  onPendingChange,
}: {
  startDate: string;
  endDate: string;
  onSaveAction: (input: ActivityInput) => Promise<void>;
  initialValues?: ActivityInput;
  confirmSave?: () => boolean;
  onCancelAction?: () => void;
  onReloadAction?: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const id = useId();
  const [initial] = useState(initialValues);
  const editing = Boolean(initial);
  const [defaults] = useState<ActivityInput>(
    () =>
      initialValues ?? {
        title: "",
        day: startDate,
        startTime: null,
        location: "",
        estimatedCost: 0,
      },
  );
  const [conflict, setConflict] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ActivityInput, string[]>>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const fields = [
    { name: "title", label: "Nome do passeio", type: "text", required: true },
    { name: "day", label: "Dia", type: "date", required: true },
    { name: "startTime", label: "Horário (opcional)", type: "time", required: false },
    { name: "location", label: "Local ou endereço (opcional)", type: "text", required: false },
    {
      name: "estimatedCost",
      label: "Custo estimado por pessoa (R$)",
      type: "number",
      required: true,
    },
  ] as const;

  function updatePending(value: boolean) {
    setPending(value);
    onPendingChange?.(value);
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaved(false);
    setError("");
    const result = activitySchema.safeParse(readValues(form));
    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }
    if (result.data.day < startDate || result.data.day > endDate) {
      setErrors({ day: ["Escolha um dia dentro do período da viagem."] });
      return;
    }
    setErrors({});
    if (initial && !sameActivityValues(initial, result.data) && confirmSave && !confirmSave())
      return;
    updatePending(true);
    try {
      await onSaveAction(result.data);
      if (!editing) form.reset();
      onDirtyChange?.(false);
      setSaved(true);
    } catch (error) {
      setError(errorMessage(error));
      if (CombinedGraphQLErrors.is(error)) {
        setConflict(error.errors.some((item) => item.extensions?.code === "CONFLICT"));
        const fields = error.errors.find((item) => item.extensions?.fieldErrors)?.extensions
          ?.fieldErrors;
        if (fields && typeof fields === "object")
          setErrors(fields as Partial<Record<keyof ActivityInput, string[]>>);
      }
    } finally {
      updatePending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      onChange={(event) =>
        onDirtyChange?.(!sameActivityValues(defaults, readValues(event.currentTarget)))
      }
      noValidate
      aria-label={editing ? "Editar passeio" : "Sugerir passeio"}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label htmlFor={id + field.name} className="text-sm font-medium">
              {field.label}
            </label>
            <Input
              id={id + field.name}
              name={field.name}
              type={field.type}
              required={field.required}
              disabled={pending}
              autoFocus={field.name === "title"}
              defaultValue={
                initial
                  ? (initial[field.name] ?? "")
                  : field.name === "day"
                    ? startDate
                    : field.name === "estimatedCost"
                      ? 0
                      : undefined
              }
              min={
                field.name === "day" ? startDate : field.name === "estimatedCost" ? 0 : undefined
              }
              max={
                field.name === "day"
                  ? endDate
                  : field.name === "estimatedCost"
                    ? 1000000
                    : undefined
              }
              step={field.name === "estimatedCost" ? "0.01" : undefined}
              aria-invalid={Boolean(errors[field.name])}
              aria-describedby={errors[field.name] ? id + field.name + "-error" : undefined}
            />
            {errors[field.name] && (
              <p id={id + field.name + "-error"} role="alert" className="text-sm text-destructive">
                {errors[field.name]?.[0]}
              </p>
            )}
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-primary">
          {editing ? "Passeio atualizado." : "Passeio adicionado às sugestões."}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-2">
        {conflict && onReloadAction && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              if (!window.confirm("Descartar suas alterações e carregar a versão atual?")) return;
              updatePending(true);
              try {
                await onReloadAction();
              } catch (error) {
                setError(errorMessage(error));
              } finally {
                updatePending(false);
              }
            }}
          >
            Carregar versão atual
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar sugestão"}
        </Button>
        {onCancelAction && (
          <Button type="button" variant="outline" disabled={pending} onClick={onCancelAction}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
