import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label font-semibold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember)] disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--color-ember)] text-white hover:opacity-92 active:opacity-88",
        variant === "secondary" &&
          "border border-[var(--color-forest)]/20 bg-white text-[var(--color-forest)] hover:bg-[var(--color-mist)]/40",
        variant === "ghost" && "text-[var(--color-forest)] hover:bg-[var(--color-mist)]/50",
        className,
      )}
      {...props}
    />
  );
}
