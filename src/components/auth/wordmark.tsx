import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** Larger “hero” treatment for auth left panel */
  variant?: "default" | "hero";
};

/** MyCult word treatment: capital M and C per style guide §1.3 — League Spartan, Ember on “C”. */
export function Wordmark({ className, variant = "default" }: WordmarkProps) {
  if (variant === "hero") {
    return (
      <p
        className={cn(
          "font-bold tracking-tight text-white",
          "text-[1.625rem] leading-tight sm:text-[1.875rem]",
          className,
        )}
      >
        <span className="text-white">My</span>
        <span className="text-[var(--color-ember)]">C</span>
        <span className="text-white">ult</span>
      </p>
    );
  }

  return (
    <p
      className={cn(
        "font-bold tracking-tight text-[var(--color-forest)]",
        "text-title2",
        className,
      )}
    >
      <span>My</span>
      <span className="text-[var(--color-ember)]">C</span>
      <span>ult</span>
    </p>
  );
}
