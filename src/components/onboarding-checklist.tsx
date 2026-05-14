import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Check, Circle } from "lucide-react";

export type OnboardingFlags = {
  onboarding_profile_done?: boolean | null;
  onboarding_locations_done?: boolean | null;
  onboarding_rules_done?: boolean | null;
  onboarding_invites_done?: boolean | null;
};

export function OnboardingChecklist({ flags }: { flags: OnboardingFlags }) {
  const steps = [
    {
      id: "profile",
      title: "Organisation profile",
      description: "Trading name, currency, timezone, and branding.",
      done: flags.onboarding_profile_done ?? false,
      href: "/settings/profile",
    },
    {
      id: "locations",
      title: "Locations",
      description: "At least one site for transaction attribution.",
      done: flags.onboarding_locations_done ?? false,
      href: "/settings/locations",
    },
    {
      id: "rules",
      title: "Points & rules",
      description: "Spend-based earn, optional rules, and programme status.",
      done: flags.onboarding_rules_done ?? false,
      href: "/settings/programme",
    },
    {
      id: "invites",
      title: "Staff & invites",
      description: "Cashiers and team access.",
      done: flags.onboarding_invites_done ?? false,
      href: "/settings/staff",
    },
  ] as const;

  const completed = steps.filter((s) => s.done).length;

  return (
    <Card>
      <CardTitle className="mb-1">Getting started</CardTitle>
      <p className="mb-4 text-body-sm text-[var(--color-forest)]/75">
        {completed} of {steps.length} steps complete.
      </p>
      <ul className="flex flex-col gap-3">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex gap-3 rounded-lg border border-[var(--color-forest)]/10 bg-[var(--color-mist)]/10 px-3 py-3"
          >
            <div className="mt-0.5 shrink-0 text-[var(--color-ember)]">
              {step.done ? (
                <Check className="size-5" aria-hidden strokeWidth={2.5} />
              ) : (
                <Circle className="size-5 opacity-40" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--color-forest)]">{step.title}</p>
              <p className="mt-0.5 text-body-sm text-[var(--color-forest)]/75">
                {step.description}
              </p>
              <Link
                href={step.href}
                className="mt-1.5 inline-block text-body-sm font-semibold text-[var(--color-ember)] underline-offset-2 hover:underline"
              >
                {step.done ? "Review" : "Continue"}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
