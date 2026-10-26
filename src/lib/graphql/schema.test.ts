import { graphql, validate } from "graphql";
import { schema } from "./schema";
import * as documents from "@/features/trips/graphql/documents";

describe("contrato GraphQL", () => {
  it.each(Object.entries(documents))("%s corresponde ao schema do servidor", (_, document) => {
    expect(validate(schema, document)).toEqual([]);
  });

  it("recusa acesso sem identidade antes de consultar o banco", async () => {
    const result = await graphql({
      schema,
      source: "{ trips { total } }",
      contextValue: { userId: "" },
    });
    expect(result.errors?.[0].extensions.code).toBe("UNAUTHENTICATED");
  });

  it("valida a entrada antes de persistir", async () => {
    const result = await graphql({
      schema,
      source:
        'mutation { createTrip(input: { name: "x", destination: "SP", startDate: "2026-12-12", endDate: "2026-12-10" }) { id } }',
      contextValue: { userId: "test" },
    });
    expect(result.errors?.[0].extensions.code).toBe("BAD_USER_INPUT");
  });
});
