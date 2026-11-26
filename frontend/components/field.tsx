import { CircleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

// A form field: visible label, optional hint, and the error messages shown right under the control.
// The element id defaults to the field name. Next keeps the previous pages hidden in the DOM, so two pages
// that share a field name (the "date" of two pages) must pass distinct `id`s.

type FieldProps = {
  label: string;
  name: string;
  hint?: string;
  optional?: boolean;
  errors?: string[];
};

const CONTROL_CLASSES = "min-h-11 w-full rounded-md border bg-surface px-3 py-2 text-base text-foreground";

export function InputField({ label, hint, optional, errors, ...input }: FieldProps & ComponentProps<"input">) {
  const id = input.id ?? input.name;
  return (
    <FieldShell label={label} id={id} hint={hint} optional={optional} errors={errors}>
      <input type="text" className={controlClassName(errors)} {...controlAttributes(id, hint, errors)} {...input} />
    </FieldShell>
  );
}

export function TextAreaField({ label, hint, optional, errors, ...textarea }: FieldProps & ComponentProps<"textarea">) {
  const id = textarea.id ?? textarea.name;
  return (
    <FieldShell label={label} id={id} hint={hint} optional={optional} errors={errors}>
      <textarea
        rows={4}
        className={controlClassName(errors)}
        {...controlAttributes(id, hint, errors)}
        {...textarea}
      />
    </FieldShell>
  );
}

export function SelectField({ label, hint, optional, errors, ...select }: FieldProps & ComponentProps<"select">) {
  const id = select.id ?? select.name;
  return (
    <FieldShell label={label} id={id} hint={hint} optional={optional} errors={errors}>
      <select className={controlClassName(errors)} {...controlAttributes(id, hint, errors)} {...select} />
    </FieldShell>
  );
}

// Message for an error that belongs to the whole form rather than to one field.
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

function FieldShell({
  label,
  id,
  hint,
  optional,
  errors,
  children,
}: Omit<FieldProps, "name"> & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (facultatif)</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {errors && errors.length > 0 && (
        <div id={`${id}-error`} className="flex flex-col gap-1">
          {errors.map((message) => (
            <FormError key={message}>{message}</FormError>
          ))}
        </div>
      )}
    </div>
  );
}

function controlClassName(errors?: string[]): string {
  const borderClass = errors && errors.length > 0 ? "border-destructive" : "border-border-input";
  return `${CONTROL_CLASSES} ${borderClass}`;
}

// Links the control to its hint and error messages for screen readers.
function controlAttributes(id: string, hint?: string, errors?: string[]) {
  const hasErrors = errors !== undefined && errors.length > 0;
  const describedBy = [hint ? `${id}-hint` : null, hasErrors ? `${id}-error` : null].filter(Boolean).join(" ");

  return {
    id,
    "aria-invalid": hasErrors || undefined,
    "aria-describedby": describedBy || undefined,
  };
}
