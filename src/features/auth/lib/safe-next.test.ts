import { describe, expect, it } from "@jest/globals";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it.each(["https://example.org", "//example.org", "/\\evil", "/viagens/\\evil", "/login", "/viagens\n"])("rejects unsafe destination %s", (value) => {
    expect(safeNext(value)).toBe("/viagens");
  });
  it("preserves an invitation after login", () => {
    expect(safeNext("/convites/token")).toBe("/convites/token");
  });
});

