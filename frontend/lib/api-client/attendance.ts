import { apiFetch, jsonRequest } from "./client";
import type { AttendanceDay, AttendanceEntryInput, TraineeSummary } from "./types";

// One small function per endpoint of AttendanceController. Pages and Server Actions call these
// and never deal with fetch or status codes. Dates are "yyyy-MM-dd".

export function getAttendanceDay(date: string): Promise<AttendanceDay> {
  return apiFetch(`/api/attendance/${date}`);
}

// Saves the whole day in one request; an existing day is updated, never duplicated.
export function saveAttendanceDay(date: string, entries: AttendanceEntryInput[]): Promise<AttendanceDay> {
  return apiFetch(`/api/attendance/${date}`, jsonRequest("PUT", { entries }));
}

export function getSummary(from: string, to: string): Promise<TraineeSummary[]> {
  return apiFetch(`/api/attendance/summary?from=${from}&to=${to}`);
}
