import { ATTENDANCE_STATUSES, type AttendanceEntryInput, type AttendanceStatus } from "./api-client/types";
import { readText } from "./form-data";
import type { FormValues } from "./form-state";

// Name of the radio group of a trainee in the attendance form: "status-3".
export function statusFieldName(traineeId: number): string {
  return `status-${traineeId}`;
}

// Reads the attendance form: a hidden "traineeId" per line, and one radio group per trainee.
// A trainee with no choice is sent with a null status: the API refuses the day and names them.
// `values` is what to put back in the form after a refusal.
export function readAttendanceInput(formData: FormData): { entries: AttendanceEntryInput[]; values: FormValues } {
  const entries: AttendanceEntryInput[] = [];
  const values: FormValues = {};

  for (const rawId of formData.getAll("traineeId")) {
    const traineeId = Number(rawId);
    const status = readStatus(formData, traineeId);
    entries.push({ traineeId, status });
    if (status !== null) values[statusFieldName(traineeId)] = status;
  }

  return { entries, values };
}

// An unknown value cannot come from our radios: treat it as "not chosen".
function readStatus(formData: FormData, traineeId: number): AttendanceStatus | null {
  const value = readText(formData, statusFieldName(traineeId));
  return (ATTENDANCE_STATUSES as readonly string[]).includes(value) ? (value as AttendanceStatus) : null;
}
