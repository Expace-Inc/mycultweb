"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AuthMode = "signin" | "signup";

type LoginAuthPanelProps = {
  /** `next` from URL (e.g. deep link); sign-in only — sign-up always finishes on dashboard or setup. */
  urlNext: string | null;
  /** Member join from `/join` — sign-up skips operator vendor bootstrap. */
  joinAsMember?: boolean;
  initialMode: AuthMode;
};

const PASSWORD_MIN = 8;

export function LoginAuthPanel({
  urlNext,
  joinAsMember = false,
  initialMode,
}: LoginAuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const signInNext =
    urlNext && urlNext.length > 0 ? urlNext : "/dashboard";

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signErr) {
      setError(
        signErr.message.includes("Invalid login credentials")
          ? "Incorrect email or password."
          : signErr.message,
      );
      return;
    }

    router.refresh();
    router.replace(signInNext);
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const businessName = String(fd.get("business_name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm_password") ?? "");

    if (!businessName || !email || !password) {
      setError("Fill in business name, email, and password.");
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: joinAsMember
          ? `${origin}/auth/callback?next=${encodeURIComponent(signInNext)}`
          : `${origin}/auth/callback?next=${encodeURIComponent("/setup")}`,
        data: {
          business_name: businessName,
        },
      },
    });
    setLoading(false);

    if (signErr) {
      if (
        signErr.message.toLowerCase().includes("already registered") ||
        signErr.message.toLowerCase().includes("already been registered")
      ) {
        setError("This email is already registered. Try signing in.");
      } else {
        setError(signErr.message);
      }
      return;
    }

    if (data.session) {
      if (joinAsMember && signInNext.startsWith("/join")) {
        router.refresh();
        router.replace(signInNext);
        return;
      }

      const { error: bootErr } = await supabase.rpc(
        "bootstrap_vendor_for_user",
        {
          p_trading_name: businessName,
          p_legal_name: null,
          p_currency: "LKR",
          p_timezone: "Asia/Colombo",
        },
      );

      if (bootErr) {
        if (bootErr.message?.includes("already_has_vendor")) {
          router.refresh();
          router.replace("/dashboard");
          return;
        }
        setError(
          bootErr.message ||
            "Account created but organisation setup failed. Try completing setup after sign-in.",
        );
        router.refresh();
        router.replace("/setup");
        return;
      }

      router.refresh();
      router.replace("/dashboard");
      return;
    }

    setInfo(
      "We sent a verification link to your email. After you confirm, sign in here — your business name is saved for the next step.",
    );
    form.reset();
  }

  const tabIdSignin = "auth-tab-signin";
  const tabIdSignup = "auth-tab-signup";
  const panelId = "auth-form-panel";

  return (
    <Card className="auth-card border-[var(--color-forest)]/12">
      <div
        className="flex rounded-xl border border-[var(--color-forest)]/12 bg-[var(--color-mist)]/20 p-1"
        role="tablist"
        aria-label="Sign in or create account"
      >
        <button
          id={tabIdSignin}
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          aria-controls={panelId}
          tabIndex={mode === "signin" ? 0 : -1}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-label font-semibold tracking-wide transition-colors",
            mode === "signin"
              ? "bg-white text-[var(--color-forest)] shadow-sm"
              : "text-[var(--color-forest)]/55 hover:text-[var(--color-forest)]/85",
          )}
          onClick={() => {
            setMode("signin");
            setError(null);
            setInfo(null);
          }}
        >
          Sign in
        </button>
        <button
          id={tabIdSignup}
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          aria-controls={panelId}
          tabIndex={mode === "signup" ? 0 : -1}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-label font-semibold tracking-wide transition-colors",
            mode === "signup"
              ? "bg-white text-[var(--color-forest)] shadow-sm"
              : "text-[var(--color-forest)]/55 hover:text-[var(--color-forest)]/85",
          )}
          onClick={() => {
            setMode("signup");
            setError(null);
            setInfo(null);
          }}
        >
          Sign up
        </button>
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={mode === "signin" ? tabIdSignin : tabIdSignup}
        className="mt-6"
      >
        {mode === "signin" ? (
          <>
            <CardTitle className="text-title1 font-semibold text-[var(--color-forest)]">
              Sign in
            </CardTitle>
            <p className="mt-2 text-body-sm text-[var(--color-forest)]/72">
              Enter the email and password for your MyCult operator account.
            </p>
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSignIn}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signin-email">Work email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@yourbusiness.com"
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full gap-2"
                disabled={loading}
              >
                <LogIn className="size-4 shrink-0 opacity-95" aria-hidden />
                Sign in
              </Button>
            </form>
          </>
        ) : (
          <>
            <CardTitle className="text-title1 font-semibold text-[var(--color-forest)]">
              Create your account
            </CardTitle>
            <p className="mt-2 text-body-sm text-[var(--color-forest)]/72">
              {joinAsMember
                ? "Use your personal email. After this step you will return to the join page to confirm membership."
                : "Add your business name and credentials. If email confirmation is enabled on the project, you will verify by link before signing in."}
            </p>
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSignUp}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="business_name">
                  {joinAsMember ? "Your name" : "Business name"}
                </Label>
                <Input
                  id="business_name"
                  name="business_name"
                  type="text"
                  autoComplete={joinAsMember ? "name" : "organization"}
                  required
                  placeholder={
                    joinAsMember ? "First and last name" : "Your trading name"
                  }
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-email">
                  {joinAsMember ? "Email" : "Work email"}
                </Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={
                    joinAsMember ? "you@example.com" : "name@yourbusiness.com"
                  }
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={PASSWORD_MIN}
                  className="h-11"
                />
                <p className="text-body-sm text-[var(--color-forest)]/55">
                  At least {PASSWORD_MIN} characters.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm_password">Confirm password</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={PASSWORD_MIN}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full gap-2"
                disabled={loading}
              >
                <UserPlus className="size-4 shrink-0 opacity-95" aria-hidden />
                Create account
              </Button>
            </form>
          </>
        )}

        {error && (
          <p
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-body-sm text-red-900"
            role="alert"
          >
            {error}
          </p>
        )}
        {info && (
          <p className="mt-5 rounded-lg border border-[var(--color-forest)]/15 bg-[var(--color-forest)]/[0.06] px-3 py-2.5 text-body-sm text-[var(--color-forest)]">
            {info}
          </p>
        )}

        <p className="mt-6 border-t border-[var(--color-mist)] pt-5 text-body-sm text-[var(--color-forest)]/65">
          {mode === "signin"
            ? "New to MyCult? Choose Sign up to register your business."
            : "Already registered? Choose Sign in."}
        </p>
      </div>
    </Card>
  );
}
