import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-[var(--color-forest)]/15 bg-white px-3 py-2 text-body text-[var(--color-forest)] shadow-sm placeholder:text-[var(--color-forest)]/40 focus:border-[var(--color-ember)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ember)]/25",
        className,
      )}
      {...props}
    />
  );
}
