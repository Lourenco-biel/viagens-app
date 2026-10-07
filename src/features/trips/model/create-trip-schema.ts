import {z} from "zod";

import type { CreateTripInput } from "./create-trip";

export const createTripSchema = z.object({
  name: z
  .string( )
  .trim()
  .min(3, "O nome deve ter pelo menos 3 caracteres.")
  .max(80, "O nome deve ter no máximo 80 caracteres."),
destination:z.string()
.trim()
.min(2,"O destino deve ter pelos menos 2 caracteres.")
.max(120, "O destino deve ter no máximo 120 caracteres."),

startDate:z.iso.date({
  error: "Informe uma data de início válida."
}),

endDate: z.iso.date({
  error: "Informe uma data de término válida."
}),
})
.refine((trip)=> trip.endDate >= trip.startDate,{
  error:"A data de término deve ser igual ou posterior ao início.",
  path:["endDate"],
}) satisfies z.ZodType<CreateTripInput>;