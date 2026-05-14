import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function HelpSettingsPage() {
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

  const supportEmail = "support@mycult.com";
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent("MyCult Operator — help request")}&body=${encodeURIComponent(`Account: ${user.email ?? ""}\nPlease describe your issue:\n`)}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Help</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Documentation, support, and programme questions.
        </p>
      </div>

      <Card>
        <CardTitle className="mb-2">Request help</CardTitle>
        <p className="mb-4 text-body-sm text-[var(--color-forest)]/75">
          Email the MyCult team with your business context. We reply on business
          days.
        </p>
        <a
          href={mailto}
          className="inline-flex rounded-lg bg-[var(--color-ember)] px-4 py-2.5 text-label font-semibold text-white hover:opacity-92"
        >
          Email support
        </a>
        <p className="mt-3 text-body-sm text-[var(--color-forest)]/60">
          {supportEmail}
        </p>
      </Card>

      <Card>
        <CardTitle className="mb-3">Common topics</CardTitle>
        <ul className="list-inside list-disc space-y-2 text-body-sm text-[var(--color-forest)]/85">
          <li>Earn rules and points — see Points & rules under Settings.</li>
          <li>Locations and attribution — see Locations.</li>
          <li>Cashier devices and invites — see Staff & invites.</li>
          <li>Billing and plans — coming soon in this portal.</li>
        </ul>
      </Card>
    </div>
  );
}
