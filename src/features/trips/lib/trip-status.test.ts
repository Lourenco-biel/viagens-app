import { expect, it } from "@jest/globals";
import { getTripStatus } from "./trip-status";

it("includes both calendar boundaries in an ongoing trip", () => {
  expect(getTripStatus("2026-12-10", "2026-12-12", "2026-12-09")).toBe("upcoming");
  expect(getTripStatus("2026-12-10", "2026-12-12", "2026-12-10")).toBe("ongoing");
  expect(getTripStatus("2026-12-10", "2026-12-12", "2026-12-12")).toBe("ongoing");
  expect(getTripStatus("2026-12-10", "2026-12-12", "2026-12-13")).toBe("completed");
});

