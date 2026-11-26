// These types mirror the DTOs of the ASP.NET Core API (backend/Api/Dtos).
// When a DTO changes, update the matching type here.

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Late"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

// One line of a day. status is null while the trainee has not been recorded for that day.
export interface AttendanceEntry {
  traineeId: number;
  traineeName: string;
  status: AttendanceStatus | null;
}

// A whole day: every trainee, with the saved status if any.
export interface AttendanceDay {
  date: string; // "yyyy-MM-dd"
  isRecorded: boolean;
  entries: AttendanceEntry[];
}

// Request body of the save. A null status means "not chosen": the API answers 400 and names the trainee.
export interface AttendanceEntryInput {
  traineeId: number;
  status: AttendanceStatus | null;
}

export interface TraineeSummary {
  traineeId: number;
  traineeName: string;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  recordedDays: number;
  // Percentage with one decimal (late days count as attended); null when no day is recorded.
  attendanceRate: number | null;
}

// Validation messages per form field, with camelCase field names: { date: ["La date n'est pas valide."] }
export type FieldErrors = Record<string, string[]>;
