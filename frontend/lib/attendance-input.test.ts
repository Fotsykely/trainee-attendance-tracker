import { describe, expect, it } from "vitest";
import { readAttendanceInput } from "./attendance-input";

function formWith(fields: [string, string][]): FormData {
  const formData = new FormData();
  for (const [name, value] of fields) formData.append(name, value);
  return formData;
}

describe("readAttendanceInput", () => {
  it("reads one entry per trainee, in the order of the form", () => {
    const { entries } = readAttendanceInput(
      formWith([
        ["traineeId", "1"],
        ["status-1", "Present"],
        ["traineeId", "2"],
        ["status-2", "Late"],
        ["traineeId", "3"],
        ["status-3", "Absent"],
      ]),
    );

    expect(entries).toEqual([
      { traineeId: 1, status: "Present" },
      { traineeId: 2, status: "Late" },
      { traineeId: 3, status: "Absent" },
    ]);
  });

  it("sends a null status for a trainee with no choice, and keeps only the choices as form values", () => {
    const { entries, values } = readAttendanceInput(
      formWith([
        ["traineeId", "1"],
        ["status-1", "Present"],
        ["traineeId", "2"],
      ]),
    );

    expect(entries).toEqual([
      { traineeId: 1, status: "Present" },
      { traineeId: 2, status: null },
    ]);
    expect(values).toEqual({ "status-1": "Present" });
  });

  it("treats an unknown status as not chosen", () => {
    const { entries } = readAttendanceInput(
      formWith([
        ["traineeId", "1"],
        ["status-1", "Maybe"],
      ]),
    );

    expect(entries).toEqual([{ traineeId: 1, status: null }]);
  });
});
