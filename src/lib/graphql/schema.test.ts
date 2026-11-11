import { graphql, validate } from "graphql";
import { schema } from "./schema";
import * as documents from "@/features/trips/graphql/documents";
import * as trips from "@/features/trips/server/trip-service";

jest.mock("@/features/trips/server/trip-service", () => ({
  __esModule: true,
  ...jest.requireActual("@/features/trips/server/trip-service"),
}));

describe("contrato GraphQL", () => {
  const budgetMutation =
    'mutation Budget($input: TripBudgetInput!) { setTripBudget(id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", input: $input) { id budgetPerPerson } }';
  it("orçamento exige autenticação e propriedade presente", async () => {
    for (const [userId, input, code] of [
      ["", { budgetPerPerson: "0" }, "UNAUTHENTICATED"],
      ["test", {}, "BAD_USER_INPUT"],
    ]) {
      const result = await graphql({
        schema,
        source: budgetMutation,
        variableValues: { input },
        contextValue: { userId },
      });
      expect(result.errors?.[0].extensions.code).toBe(code);
    }
    const result = await graphql({
      schema,
      source: budgetMutation,
      variableValues: { input: { budgetPerPerson: 500 } },
      contextValue: { userId: "test" },
    });
    expect(result.errors?.[0].message).toContain("String");
  });
  it.each([null, "0.00", "9007199254740993.01"])(
    "transporta %s e não busca novamente null",
    async (value) => {
      const detail = jest
        .spyOn(trips, "tripDetail")
        .mockResolvedValue({ id: "trip", budgetPerPerson: value } as Awaited<
          ReturnType<typeof trips.tripDetail>
        >);
      const result = await graphql({
        schema,
        source: '{ trip(id: "trip") { budgetPerPerson } }',
        contextValue: { userId: "test" },
      });
      expect(result.errors).toBeUndefined();
      expect(result.data?.trip).toEqual({ budgetPerPerson: value });
      expect(detail).toHaveBeenCalledTimes(1);
      detail.mockRestore();
    },
  );
  it("resolve orçamento ausente no objeto da listagem por detalhe autorizado", async () => {
    const list = jest
      .spyOn(trips, "listTrips")
      .mockResolvedValue({ items: [{ id: "trip" }], total: 1, hasTrips: true } as Awaited<
        ReturnType<typeof trips.listTrips>
      >);
    const detail = jest
      .spyOn(trips, "tripDetail")
      .mockResolvedValue({ budgetPerPerson: "500.00" } as Awaited<
        ReturnType<typeof trips.tripDetail>
      >);
    const result = await graphql({
      schema,
      source: "{ trips { items { budgetPerPerson } } }",
      contextValue: { userId: "test" },
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.trips).toEqual({ items: [{ budgetPerPerson: "500.00" }] });
    expect(detail).toHaveBeenCalledWith(expect.objectContaining({ userId: "test" }), "trip");
    list.mockRestore();
    detail.mockRestore();
  });
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
  it("recusa edição anônima antes de consultar o banco", async () => {
    const result = await graphql({
      schema,
      source:
        'mutation { updateActivity(id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", expectedVersion: 1, input: { title: "Museu", day: "2026-12-11", location: "", estimatedCost: 0 }) { id } }',
      contextValue: { userId: "" },
    });
    expect(result.errors?.[0].extensions.code).toBe("UNAUTHENTICATED");
  });
});
