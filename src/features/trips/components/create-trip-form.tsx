'use client'

import { useId, useState, type SubmitEvent } from "react";
import { useCreateTripForm } from "../hooks/use-create-trip-form";
import { CreateTripInput } from "../model/create-trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTripDate } from "../lib/format-trip-date";

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

export function CreateTripForm() {
  const formId = useId();
  const { fieldErrors, validate } = useCreateTripForm();
  const [reviewedTrip, setReviewedTrip] = useState<CreateTripInput | null>(null);

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
        onChange={() => setReviewedTrip(null)}
        noValidate
        aria-label="Nova viagem"
        className="space-y-6"
      >
        <p className="text-sm text-muted-foreground">
          Todos os campos são obrigatórios.
        </p>

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
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                />

                {error && (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Button type="submit">Revisar viagem</Button>
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
          </section>
        )}
      </div>
    </div>
  );
}
