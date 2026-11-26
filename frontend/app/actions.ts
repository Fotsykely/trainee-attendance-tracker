"use server";

import { saveAttendanceDay } from "@/lib/api-client/attendance";
import { readAttendanceInput } from "@/lib/attendance-input";
import { toFormState } from "@/lib/form-errors";
import type { FormState } from "@/lib/form-state";
import { formatDate } from "@/lib/format";
import { revalidateAllPages } from "@/lib/revalidate";

// Form field names, used to keep only the API messages that belong to this form.
const ATTENDANCE_FIELDS = ["date", "entries"] as const;

// Bound to the day by the attendance page: saveAttendanceAction.bind(null, date).
// The action stays thin: read the form, call the API client, return the outcome.
export async function saveAttendanceAction(
  date: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { entries, values } = readAttendanceInput(formData);

  try {
    await saveAttendanceDay(date, entries);
  } catch (error) {
    return toFormState(error, ATTENDANCE_FIELDS, values);
  }

  // The user stays on the page, which now shows the saved day (and the "already recorded" notice).
  revalidateAllPages();
  return { status: "success", message: `Pointage du ${formatDate(date)} enregistré.`, values };
}
