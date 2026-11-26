"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/button";
import type { ComponentProps } from "react";

type SubmitButtonProps = Pick<ComponentProps<typeof Button>, "variant" | "children"> & {
  pendingLabel?: string;
};

// Must sit inside the <form>: useFormStatus reads the state of the closest parent form.
// Disabling it while the request runs prevents a double submission.
export function SubmitButton({ variant, children, pendingLabel = "Enregistrement…" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
