import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("vendor_users")
    .select("vendor_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!staff?.vendor_id) {
    redirect("/setup");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Account</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Sign-in email and password for this operator session.
        </p>
      </div>

      <Card>
        <CardTitle className="mb-2">Email</CardTitle>
        <p className="text-body text-[var(--color-forest)]">{user.email}</p>
        <p className="mt-2 text-body-sm text-[var(--color-forest)]/65">
          To change email, contact support or use your identity provider’s flow
          when available.
        </p>
      </Card>

      <Card>
        <CardTitle className="mb-4">Change password</CardTitle>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
