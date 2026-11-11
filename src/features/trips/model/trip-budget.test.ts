import { tripBudgetSchema } from "./trip-budget";

describe("orçamento decimal textual", () => {
  test.each([
    [null, null],
    ["0", "0.00"],
    ["500", "500.00"],
    ["600.5", "600.50"],
    ["001.20", "1.20"],
    ["9007199254740993.01", "9007199254740993.01"],
  ])("normaliza %s sem perder precisão", (value, expected) => {
    expect(tripBudgetSchema.parse({ budgetPerPerson: value }).budgetPerPerson).toBe(expected);
  });
  test.each([
    undefined,
    "",
    " ",
    "-1",
    "+1",
    "1e2",
    "1,20",
    "1.000,00",
    500,
    "1.001",
    "1.230",
    "NaN",
    "Infinity",
    " 1 ",
    "1\n",
    "1.20\r",
    "1\u2028",
  ])("recusa %s", (value) => {
    expect(tripBudgetSchema.safeParse({ budgetPerPerson: value }).success).toBe(false);
  });
  it("exige a propriedade mesmo sendo anulável", () => {
    expect(tripBudgetSchema.safeParse({}).success).toBe(false);
  });
});
