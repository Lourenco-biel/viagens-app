import { describe, expect, it } from "@jest/globals";

import { createTripSchema } from "./create-trip-schema";

describe("createTripSchema", () => {
  const validInput = {
    name: "Passeio em família",
    destination: "Curitiba, PR",
    startDate: "2026-12-10",
    endDate: "2026-12-12",
  };

  it("aceita uma viagem que começa e termina no mesmo dia ", () => {
    const result = createTripSchema.safeParse({
      ...validInput,
      endDate: "2026-12-10",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita uma viagem que termina antes de começar e associa o erro ao campo", () => {
    const result = createTripSchema.safeParse({
      ...validInput,
      endDate: "2026-12-09",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("A validação deveria rejeitar esse periodo");
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["endDate"],
          message: "A data de término deve ser igual ou posterior ao início.",
        }),
      ]),
    );
  });
});
