import { ApiValidationError } from "./api-client/client";
import type { FormState, FormValues } from "./form-state";

const GENERIC_MESSAGE = "Les données envoyées sont invalides.";

// Turns an API validation error into the state that redisplays the form with a message under each field.
// Any other error is unexpected: it is rethrown so that error.tsx handles it.
export function toFormState(error: unknown, formFields: readonly string[], values: FormValues): FormState {
  if (!(error instanceof ApiValidationError)) throw error;

  // Keys such as "$.dueDate" come from JSON parsing errors and carry technical messages: never shown.
  const fieldErrors = Object.fromEntries(
    Object.entries(error.fieldErrors).filter(([field]) => formFields.includes(field)),
  );
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return { status: "error", message: hasFieldErrors ? null : GENERIC_MESSAGE, fieldErrors, values };
}
