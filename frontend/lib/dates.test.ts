import { describe, expect, it } from "vitest";
import { firstDayOfMonthIso, firstParam, parseIsoDay, todayIso } from "./dates";

describe("dates", () => {
  it("formats today in the local time zone, with zero-padded month and day", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("gives the first day of the month", () => {
    expect(firstDayOfMonthIso(new Date(2026, 10, 26))).toBe("2026-11-01");
  });

  it("accepts a real calendar day, including a leap day", () => {
    expect(parseIsoDay("2026-11-26")).toBe("2026-11-26");
    expect(parseIsoDay("2028-02-29")).toBe("2028-02-29");
  });

  it("rejects text that is not a real calendar day", () => {
    expect(parseIsoDay(undefined)).toBeNull();
    expect(parseIsoDay("")).toBeNull();
    expect(parseIsoDay("26/11/2026")).toBeNull();
    expect(parseIsoDay("2026-02-30")).toBeNull();
    expect(parseIsoDay("2027-02-29")).toBeNull();
    expect(parseIsoDay("2026-13-01")).toBeNull();
  });

  it("keeps the first value of a repeated query parameter", () => {
    expect(firstParam(["2026-01-01", "2026-02-02"])).toBe("2026-01-01");
    expect(firstParam("2026-01-01")).toBe("2026-01-01");
    expect(firstParam(undefined)).toBeUndefined();
  });
});
