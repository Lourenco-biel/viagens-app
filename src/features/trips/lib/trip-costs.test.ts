import { budgetCents, compareBudget, confirmedCost, formatBRL } from "./trip-costs";

it("converte e formata orçamento grande sem Number", () => {
  const cents = budgetCents("9007199254740993.01");
  expect(cents.toString()).toBe("900719925474099301");
  expect(formatBRL(cents).replace(/\s/g, " ")).toBe("R$ 9.007.199.254.740.993,01");
  expect(formatBRL(BigInt(0)).replace(/\s/g, " ")).toBe("R$ 0,00");
});
test.each([
  [null, 32000, "undefined", null],
  ["500.00", 32000, "remaining", "18000"],
  ["500.00", 55000, "exceeded", "5000"],
  ["500.00", 50000, "reached", null],
  ["0.00", 0, "reached", null],
  ["0.00", 2000, "exceeded", "2000"],
  ["500.00", 0, "remaining", "50000"],
  ["0.30", 30, "reached", null],
  ["9007199254740993.01", 1, "remaining", "900719925474099300"],
] as const)("compara %s com %s centavos", (budget, total, state, difference) => {
  const result = compareBudget(budget, BigInt(total));
  expect(result.state).toBe(state);
  expect("difference" in result ? result.difference.toString() : null).toBe(difference);
});
it("participantes e sugestões não alteram comparação", () => {
  const trip = {
    participantCount: 1,
    activities: [{ status: "confirmed" as const, estimatedCost: 320 }],
  };
  const changed = {
    participantCount: 20,
    activities: [...trip.activities, { status: "proposed" as const, estimatedCost: 999 }],
  };
  expect(compareBudget("500", confirmedCost(changed.activities))).toEqual(
    compareBudget("500", confirmedCost(trip.activities)),
  );
});
it("soma centavos por passeio confirmado e exclui votação", () => {
  expect(
    confirmedCost([
      { status: "confirmed", estimatedCost: 0.1 },
      { status: "confirmed", estimatedCost: 0.2 },
      { status: "proposed", estimatedCost: 100 },
    ]),
  ).toBe(BigInt(30));
  expect(confirmedCost([])).toBe(BigInt(0));
});
