import { saveTrip, setTripBudget, tripDetail } from "./trip-service";
import type { GraphQLContext } from "@/lib/graphql/context";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
function context() {
  const row = {
    id,
    owner_id: id,
    name: "Viagem",
    destination: "Curitiba",
    start_date: "2026-12-10",
    end_date: "2026-12-12",
    budget_per_person: null as string | null,
  };
  const read = jest.fn().mockImplementation(async () => ({ data: { ...row }, error: null }));
  const write = jest.fn().mockImplementation(async () => ({ data: { id }, error: null }));
  const update = jest.fn().mockImplementation((values) => {
    Object.assign(row, values);
    return chain;
  });
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], error: null }),
    maybeSingle: read,
    single: write,
    update,
  };
  const from = jest.fn().mockReturnValue(chain);
  return {
    ctx: { userId: id, db: { from } } as unknown as GraphQLContext,
    row,
    read,
    write,
    update,
    from,
    chain,
  };
}
it("autoriza organizador, escreve somente orçamento e lê decimal exato", async () => {
  const { ctx, update, chain } = context();
  const result = await setTripBudget(ctx, id, { budgetPerPerson: "9007199254740993.01" });
  expect(result.budgetPerPerson).toBe("9007199254740993.01");
  expect(update).toHaveBeenCalledWith({ budget_per_person: "9007199254740993.01" });
  expect(chain.select).toHaveBeenCalledWith(expect.stringContaining("budget_per_person::text"));
  expect(chain.select.mock.calls[0][0]).not.toContain("*");
  expect(chain.eq).toHaveBeenCalledWith("id", id);
});
it("recusa participante e viagem invisível antes de escrever", async () => {
  const { ctx, row, update, read } = context();
  row.owner_id = "outro";
  await expect(setTripBudget(ctx, id, { budgetPerPerson: "500" })).rejects.toMatchObject({
    extensions: { code: "FORBIDDEN" },
  });
  read.mockResolvedValue({ data: null, error: null });
  await expect(setTripBudget(ctx, id, { budgetPerPerson: null })).rejects.toMatchObject({
    extensions: { code: "NOT_FOUND" },
  });
  expect(update).not.toHaveBeenCalled();
});
it("valida antes de escrever", async () => {
  const { ctx, from } = context();
  for (const [tripId, input] of [
    ["errado", { budgetPerPerson: "0" }],
    [id, {}],
    [id, { budgetPerPerson: -1 }],
  ] as const) {
    await expect(setTripBudget(ctx, tripId, input)).rejects.toMatchObject({
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  expect(from).not.toHaveBeenCalled();
});
it.each([
  ["23514", "BAD_USER_INPUT"],
  ["42501", "FORBIDDEN"],
  ["PGRST116", "NOT_FOUND"],
  ["XX000", "OPERATION_FAILED"],
])("traduz %s sem detalhes privados", async (code, expected) => {
  const { ctx, write } = context();
  write.mockResolvedValue({ data: null, error: { code, message: "private SQL" } });
  const error = await setTripBudget(ctx, id, { budgetPerPerson: "500" }).catch((e) => e);
  expect(error.extensions.code).toBe(expected);
  expect(error.message).not.toMatch(/private|período/);
});
it("zero linhas não representa sucesso", async () => {
  const { ctx, write } = context();
  write.mockResolvedValue({ data: null, error: null });
  await expect(setTripBudget(ctx, id, { budgetPerPerson: null })).rejects.toMatchObject({
    extensions: { code: "NOT_FOUND" },
  });
});
it("normaliza leitura e mantém orçamento na edição geral", async () => {
  const { ctx, row, update } = context();
  row.budget_per_person = "0";
  expect((await tripDetail(ctx, id)).budgetPerPerson).toBe("0.00");
  await saveTrip(
    ctx,
    { name: "Viagem nova", destination: "Recife", startDate: "2026-12-10", endDate: "2026-12-12" },
    id,
  );
  expect(update.mock.calls[0][0]).not.toHaveProperty("budget_per_person");
  expect(row.budget_per_person).toBe("0");
});
it("falha após gravar pode ser reconciliada e repetida sem efeitos adicionais", async () => {
  const { ctx, row, read } = context();
  read
    .mockResolvedValueOnce({ data: { ...row }, error: null })
    .mockResolvedValueOnce({ data: null, error: { message: "rede" } });
  await expect(setTripBudget(ctx, id, { budgetPerPerson: "500" })).rejects.toMatchObject({
    extensions: { code: "OPERATION_FAILED" },
  });
  expect(row.budget_per_person).toBe("500.00");
  expect((await tripDetail(ctx, id)).budgetPerPerson).toBe("500.00");
  expect((await setTripBudget(ctx, id, { budgetPerPerson: "500" })).budgetPerPerson).toBe("500.00");
});
