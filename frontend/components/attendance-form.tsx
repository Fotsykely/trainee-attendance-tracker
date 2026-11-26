"use client";

import { useActionState } from "react";
import { CircleCheck, Info } from "lucide-react";
import { FormError } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { ATTENDANCE_STATUSES, type AttendanceEntry } from "@/lib/api-client/types";
import { statusFieldName } from "@/lib/attendance-input";
import { ATTENDANCE_LABELS } from "@/lib/format";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/form-state";

type AttendanceFormProps = {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  entries: AttendanceEntry[];
  // True when the day was already recorded: the form is filled in and saving updates it.
  isRecorded: boolean;
};

// One line per trainee with three radio buttons; the whole list is sent with a single button.
// Nothing is pre-selected on a day never recorded: "present" must be a choice, not a default.
export function AttendanceForm({ action, entries, isRecorded }: AttendanceFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);

  const saved = Object.fromEntries(
    entries.filter((entry) => entry.status !== null).map((entry) => [statusFieldName(entry.traineeId), entry.status!]),
  );
  // After a submission the form keeps showing what was submitted (a failed save must not lose the choices).
  const values = state.status === "idle" ? saved : state.values;
  const entryErrors = state.status === "error" ? state.fieldErrors.entries : undefined;
  const dateErrors = state.status === "error" ? state.fieldErrors.date : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {isRecorded && (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-primary-subtle p-3 text-sm">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          Cette date a déjà été pointée : la validation mettra à jour le pointage.
        </p>
      )}

      {state.status === "success" && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-sm font-semibold">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}
      {state.status === "error" && state.message && <FormError>{state.message}</FormError>}
      {dateErrors?.map((message) => <FormError key={message}>{message}</FormError>)}
      {entryErrors?.map((message) => <FormError key={message}>{message}</FormError>)}

      <ul className="grid gap-3">
        {entries.map((entry) => {
          const field = statusFieldName(entry.traineeId);
          return (
            <li key={entry.traineeId} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              {/* A labelled radio group (not a <fieldset>, whose <legend> cannot sit in a flex row). */}
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <span id={`${field}-label`} className="font-semibold sm:min-w-32">
                  {entry.traineeName}
                </span>
                <input type="hidden" name="traineeId" value={entry.traineeId} />
                <div role="radiogroup" aria-labelledby={`${field}-label`} className="flex flex-wrap gap-x-2">
                  {ATTENDANCE_STATUSES.map((status) => (
                    <label key={status} className="inline-flex min-h-11 items-center gap-2 pr-3">
                      <input
                        type="radio"
                        name={field}
                        value={status}
                        defaultChecked={values[field] === status}
                        className="size-5 accent-primary"
                      />
                      {ATTENDANCE_LABELS[status]}
                    </label>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div>
        <SubmitButton>Enregistrer le pointage</SubmitButton>
      </div>
    </form>
  );
}
