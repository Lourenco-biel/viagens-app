import { sameActivityValues } from "./activity-values";

const values = {
  title: "Museu",
  day: "2026-12-11",
  startTime: null,
  location: "",
  estimatedCost: 10,
};
it("ignora espaços normalizados e representações equivalentes de custo", () => {
  expect(
    sameActivityValues(values, {
      ...values,
      title: "  Museu ",
      location: " ",
      estimatedCost: 10.0,
    }),
  ).toBe(true);
});
it.each([
  { title: "Outro museu" },
  { day: "2026-12-12" },
  { startTime: "15:00" },
  { location: "Centro" },
  { estimatedCost: 20 },
])("detecta alteração efetiva em %p", (change) => {
  expect(sameActivityValues(values, { ...values, ...change })).toBe(false);
});
