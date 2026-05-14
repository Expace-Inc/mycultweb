"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const MIN_LEN = 8;

export function ChangePasswordForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const next = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm_password") ?? "");

    if (next.length < MIN_LEN) {
      setStatus("error");
      setMessage(`Password must be at least ${MIN_LEN} characters.`);
      return;
    }
    if (next !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: next });
    setStatus("idle");

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("done");
    setMessage("Password updated. Use it next time you sign in.");
    e.currentTarget.reset();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LEN}
          className="h-11"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LEN}
          className="h-11"
        />
      </div>
      <p className="text-body-sm text-[var(--color-forest)]/60">
        At least {MIN_LEN} characters. Choose a unique password you do not use
        elsewhere.
      </p>
      <Button
        type="submit"
        className="w-fit"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Updating…" : "Update password"}
      </Button>
      {message && (
        <p
          className={
            status === "error"
              ? "text-body-sm text-red-800"
              : "text-body-sm text-[var(--color-forest)]"
          }
          role={status === "error" ? "alert" : undefined}
        >
          {message}
        </p>
      )}
    </form>
  );
}
