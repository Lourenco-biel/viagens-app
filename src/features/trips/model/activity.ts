import { z } from "zod";

export const activitySchema = z.object({
  title: z.string().trim().min(3, "Use pelo menos 3 caracteres.").max(120),
  day: z.iso.date({ error: "Informe uma data válida." }),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.")
    .nullable(),
  location: z.string().trim().max(200),
  estimatedCost: z
    .number()
    .min(0)
    .max(1000000)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
      "Use até duas casas decimais.",
    ),
});

export type ActivityInput = z.infer<typeof activitySchema>;
export type Activity = ActivityInput & {
  id: string;
  createdBy: string;
  status: "proposed" | "confirmed";
  votes: number;
  votedByMe: boolean;
  version: number;
};
export type TripMember = { userId: string; displayName: string; isOwner: boolean };
