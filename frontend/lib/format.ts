import type { AttendanceStatus } from "./api-client/types";

// Texts shown to users stay in French; identifiers and comments stay in English.
export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  Present: "Présent",
  Absent: "Absent",
  Late: "En retard",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const longDateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" });
const rateFormatter = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Accepts a full ISO date and time ("2026-11-17T15:39:33Z") or a plain date ("2026-12-31").
export function formatDate(isoDate: string): string {
  return dateFormatter.format(toDate(isoDate));
}

// "jeudi 26 novembre 2026"
export function formatLongDate(isoDate: string): string {
  return longDateFormatter.format(toDate(isoDate));
}

// "83,3 %", or "—" when the trainee has no recorded day (0 % would wrongly say "always absent").
export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${rateFormatter.format(rate)} %`;
}

function toDate(isoDate: string): Date {
  return new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
}
