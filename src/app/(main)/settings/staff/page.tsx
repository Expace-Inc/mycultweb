import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StaffSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("vendor_users")
    .select("vendor_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!staff?.vendor_id) {
    redirect("/setup");
  }

  const canEdit = staff.role === "owner" || staff.role === "manager";

  const { data: team } = await supabase
    .from("vendor_users")
    .select("id, user_id, role, is_active, created_at")
    .eq("vendor_id", staff.vendor_id)
    .order("created_at", { ascending: true });

  async function markInvitesDone() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) {
      redirect("/login");
    }

    const { data: s } = await supabase
      .from("vendor_users")
      .select("vendor_id, role")
      .eq("user_id", u.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!s?.vendor_id || (s.role !== "owner" && s.role !== "manager")) {
      redirect("/settings/staff?error=forbidden");
    }

    await supabase
      .from("vendors")
      .update({ onboarding_invites_done: true })
      .eq("id", s.vendor_id);

    redirect("/settings/staff?saved=1");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Staff & invites</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Who can operate your programme and how invites work.
        </p>
      </div>

      <Card>
        <CardTitle className="mb-2">Team access</CardTitle>
        <p className="mb-4 text-body-sm text-[var(--color-forest)]/75">
          Cashiers and managers are provisioned through MyCult admin tools and
          mobile onboarding. Need more seats or deep links? Use{" "}
          <Link
            href="/settings/help"
            className="font-semibold text-[var(--color-ember)] underline-offset-2 hover:underline"
          >
            Help
          </Link>{" "}
          to reach us.
        </p>
        <p className="mb-4 text-label text-[var(--color-forest)]/70">
          Linked accounts ({team?.length ?? 0})
        </p>
        <ul className="flex flex-col gap-2">
          {(team ?? []).map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-[var(--color-forest)]/10 px-3 py-2 text-body-sm"
            >
              <span className="capitalize text-[var(--color-forest)]">{row.role}</span>
              <span className="text-[var(--color-forest)]/50">
                {" "}
                · {row.is_active ? "Active" : "Inactive"}
              </span>
              {row.user_id === user.id && (
                <span className="ml-2 text-[var(--color-ember)]">(you)</span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {canEdit && (
        <Card>
          <CardTitle className="mb-2">Onboarding checklist</CardTitle>
          <p className="mb-4 text-body-sm text-[var(--color-forest)]/75">
            When your cashiers have been invited and are live in the field, mark
            this step complete.
          </p>
          <form action={markInvitesDone}>
            <Button type="submit" variant="secondary">
              Mark staff invites as done
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
