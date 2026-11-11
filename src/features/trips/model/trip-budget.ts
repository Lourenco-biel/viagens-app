import { z } from "zod";

export function normalizeBudget(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  return `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(2, "0")}`;
}

export const tripBudgetSchema = z.object({
  budgetPerPerson: z
    .string({ error: "Informe o orçamento em reais." })
    .regex(/^\d+(?:\.\d{1,2})?$/, "Informe um valor não negativo com até duas casas decimais.")
    .transform(normalizeBudget)
    .nullable(),
});

export type TripBudgetInput = z.infer<typeof tripBudgetSchema>;
