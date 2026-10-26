"use client";

import { useId, useState, type SubmitEvent } from "react";
import { useCreateTripForm } from "../hooks/use-create-trip-form";
import { CreateTripInput } from "../model/create-trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTripDate } from "../lib/format-trip-date";
import { errorMessage } from "@/lib/graphql/error-message";

const fields: readonly {
  name: keyof CreateTripInput;
  label: string;
  type: "text" | "date";
}[] = [
  { name: "name", label: "Nome da viagem", type: "text" },
  { name: "destination", label: "Destino", type: "text" },
  { name: "startDate", label: "Data de início", type: "date" },
  { name: "endDate", label: "Data de término", type: "date" },
];

export function CreateTripForm({
  initialValues,
  onSaveAction,
}: {
  initialValues?: CreateTripInput;
  onSaveAction?: (input: CreateTripInput) => Promise<void>;
}) {
  const formId = useId();
  const [defaults] = useState(initialValues);
  const { fieldErrors, validate } = useCreateTripForm();
  const [reviewedTrip, setReviewedTrip] = useState<CreateTripInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function save() {
    if (!reviewedTrip || !onSaveAction || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSaveAction(reviewedTrip);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const validTrip = validate(formData);

    setReviewedTrip(validTrip);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        onChange={() => {
          setReviewedTrip(null);
          setSaveError("");
        }}
        noValidate
        aria-label={initialValues ? "Editar viagem" : "Nova viagem"}
        className="space-y-6"
      >
        <p className="text-sm text-muted-foreground">Todos os campos são obrigatórios.</p>

        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => {
            const inputId = `${formId}-${field.name}`;
            const errorId = `${inputId}-error`;
            const error = fieldErrors[field.name]?.[0];

            return (
              <div key={field.name} className="space-y-2">
                <label htmlFor={inputId} className="text-sm font-medium">
                  {field.label}
                </label>

                <Input
                  id={inputId}
                  name={field.name}
                  type={field.type}
                  defaultValue={defaults?.[field.name]}
                  disabled={saving}
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                />

                {error && (
                  <p id={errorId} role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Button type="submit" disabled={saving}>
          Revisar viagem
        </Button>
      </form>

      <div aria-live="polite">
        {reviewedTrip && (
          <section
            aria-label="Resumo da viagem para revisão"
            className="space-y-2 rounded-xl border bg-card p-5"
          >
            <h2 className="text-lg font-semibold">{reviewedTrip.name}</h2>

            <p>{reviewedTrip.destination}</p>

            <p>
              {formatTripDate(reviewedTrip.startDate)}
              {" — "}
              {formatTripDate(reviewedTrip.endDate)}
            </p>

            <p className="text-sm text-muted-foreground">
              Confira os dados. A viagem ainda não foi salva.
            </p>
            {saveError && (
              <p role="alert" className="text-sm text-destructive">
                {saveError}
              </p>
            )}
            {onSaveAction && (
              <Button onClick={save} disabled={saving}>
                {saving ? "Salvando..." : "Salvar viagem"}
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
