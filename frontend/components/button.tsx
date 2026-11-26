import Link from "next/link";
import type { ComponentProps } from "react";

// "danger" is an outlined button that opens a confirmation; "destructive" is the filled button that confirms.
type ButtonVariant = "primary" | "secondary" | "danger" | "destructive";

// min-h-11 = 44px, the minimum touch target size.
const BASE_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-border-input bg-surface text-foreground hover:bg-background",
  danger: "border border-destructive bg-surface text-destructive hover:bg-background",
  destructive: "bg-destructive text-on-primary hover:bg-destructive/90",
};

function buttonClassName(variant: ButtonVariant, className?: string): string {
  return [BASE_CLASSES, VARIANT_CLASSES[variant], className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, className)} {...props} />;
}
