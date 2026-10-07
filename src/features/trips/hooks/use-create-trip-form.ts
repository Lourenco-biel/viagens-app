"use client";

import { useState } from "react";
import { z } from "zod";

import type { CreateTripInput } from "../model/create-trip";
import { createTripSchema } from "../model/create-trip-schema";

type FieldErrors = Partial<Record<keyof CreateTripInput, string[]>>;

export function useCreateTripForm() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(formData: FormData): CreateTripInput | null {
    const result = createTripSchema.safeParse({
      name: formData.get("name") ?? "",
destination: formData.get("destination") ?? "",
      startDate: formData.get("startDate") ?? "",
      endDate: formData.get("endDate") ?? "",
    });

    if (!result.success) {
      const errors = z.flattenError(result.error);

      setFieldErrors(errors.fieldErrors);

      return null;
    }

    setFieldErrors({});
    return result.data;
  }

  return {
    fieldErrors,
    validate,
  };
}
