import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginAuthPanel, type AuthMode } from "@/app/login/login-auth-panel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    next?: string;
    mode?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  if (user) {
    redirect(params.next ?? "/dashboard");
  }

  const urlNext = params.next?.length ? params.next : null;
  const initialMode: AuthMode =
    params.mode === "signup" ? "signup" : "signin";

  return (
    <AuthSplitLayout
      brand={{
        eyebrow: "Operator",
        headline: "Loyalty programme control for your business",
        body: "Configure earn rules, review members and transactions, and keep programmes healthy — built for owners and managers, with clear numbers and plain language.",
        footnote:
          "MyCult — reward regulars with clarity at the point of sale.",
      }}
    >
      <LoginAuthPanel
        key={`${initialMode}-${urlNext ?? ""}`}
        urlNext={urlNext}
        joinAsMember={Boolean(urlNext?.startsWith("/join"))}
        initialMode={initialMode}
      />

      {params.error === "auth" && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-body-sm text-amber-950">
          Session could not be started. Sign in again.
        </p>
      )}

      <p className="mt-8 text-center text-body-sm text-[var(--color-forest)]/50">
        Consumer and cashier apps use a separate sign-in.
      </p>
    </AuthSplitLayout>
  );
}
