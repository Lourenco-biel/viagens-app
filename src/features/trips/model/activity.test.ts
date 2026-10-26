import { activitySchema } from "./activity";

const valid = {
  title: "Museu",
  day: "2026-12-11",
  startTime: null,
  location: "",
  estimatedCost: 0,
};
describe("passeio", () => {
  it("permite passeio gratuito e sem horário definido", () => {
    expect(activitySchema.safeParse(valid).success).toBe(true);
  });
  it.each([-1, 1.123, 1000001, NaN])("recusa custo inválido %s", (estimatedCost) => {
    expect(activitySchema.safeParse({ ...valid, estimatedCost }).success).toBe(false);
  });
  it("recusa data e horário impossíveis", () => {
    expect(activitySchema.safeParse({ ...valid, day: "2026-02-30" }).success).toBe(false);
    expect(activitySchema.safeParse({ ...valid, startTime: "25:00" }).success).toBe(false);
  });
});
