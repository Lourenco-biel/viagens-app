"use client";

import { useId, useState, type SubmitEvent } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { activitySchema, type ActivityInput } from "../model/activity";
import { errorMessage } from "@/lib/graphql/error-message";

export function ActivityForm({
  startDate,
  endDate,
  onSaveAction,
}: {
  startDate: string;
  endDate: string;
  onSaveAction: (input: ActivityInput) => Promise<void>;
}) {
  const id = useId();
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

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaved(false);
    setError("");
    const result = activitySchema.safeParse({
      title: data.get("title"),
      day: data.get("day"),
      startTime: data.get("startTime") || null,
      location: data.get("location") || "",
      estimatedCost: data.get("estimatedCost") === "" ? NaN : Number(data.get("estimatedCost")),
    });
    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }
    if (result.data.day < startDate || result.data.day > endDate) {
      setErrors({ day: ["Escolha um dia dentro do período da viagem."] });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await onSaveAction(result.data);
      form.reset();
      setSaved(true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Sugerir passeio" className="space-y-4">
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
              defaultValue={
                field.name === "day" ? startDate : field.name === "estimatedCost" ? 0 : undefined
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
          Passeio adicionado às sugestões.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Adicionar sugestão"}
      </Button>
    </form>
  );
}
