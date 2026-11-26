import type { FieldErrors } from "./api-client/types";

// What the submitted fields contained, used to refill the form after a submission.
export type FormValues = Record<string, string>;

// Result of a form Server Action, read by the form through useActionState.
// "idle" is the initial state (the form shows its initial values). "success" is a save that keeps the
// user on the same page; the values are kept so the form still shows exactly what was saved.
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string; values: FormValues }
  | { status: "error"; message: string | null; fieldErrors: FieldErrors; values: FormValues };

export const INITIAL_FORM_STATE: FormState = { status: "idle" };
