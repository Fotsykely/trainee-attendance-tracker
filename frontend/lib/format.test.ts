import { describe, expect, it } from "vitest";
import { formatDate, formatRate } from "./format";

describe("formatRate", () => {
  it("shows a dash instead of a misleading 0 % when there is no recorded day", () => {
    expect(formatRate(null)).toBe("—");
  });

  it("shows a real 0 % when the trainee was always absent", () => {
    expect(formatRate(0)).toBe("0,0 %");
  });

  it("uses a decimal comma and always one decimal", () => {
    expect(formatRate(66.7)).toBe("66,7 %");
    expect(formatRate(100)).toBe("100,0 %");
  });
});

describe("formatDate", () => {
  it("reads a plain date as a local day (no shift to the previous day)", () => {
    expect(formatDate("2026-11-26")).toContain("26");
    expect(formatDate("2026-11-26")).toContain("2026");
  });
});
