import { DashboardVirtualCard } from "@/components/dashboard-virtual-card";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { maskPhoneE164 } from "@/lib/utils";
import { redirect } from "next/navigation";
import { TrendingUp, Users, Wallet } from "lucide-react";

type Summary = {
  ok: boolean;
  visit_count?: number;
  spend_total?: string | number;
  new_members?: number;
  points_issued?: number;
  period_days?: number;
  error?: string;
};

type MemberRow = {
  user_id: string;
  phone_e164: string;
  display_name: string | null;
  balance: string | number;
  last_visit: string;
};

export default async function DashboardPage() {
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

  const { data: vendorRow } = await supabase
    .from("vendors")
    .select("id, name, virtual_card_path")
    .eq("id", staff.vendor_id)
    .single();

  const vendorName = vendorRow?.name ?? "Your business";
  const virtualCardPath =
    (vendorRow as { virtual_card_path?: string | null } | null)
      ?.virtual_card_path ?? null;
  const canManageCard =
    staff.role === "owner" || staff.role === "manager";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const virtualCardPublicUrl =
    virtualCardPath && supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/vendor-virtual-cards/${virtualCardPath}`
      : null;

  const { data: summaryRaw } = await supabase.rpc("get_dashboard_summary", {
    p_days: 7,
  });

  const { data: membersRaw } = await supabase.rpc("list_vendor_members", {
    p_limit: 50,
    p_offset: 0,
  });

  const summary = (summaryRaw ?? {}) as Summary;
  const membersPayload = (membersRaw ?? {}) as {
    ok?: boolean;
    members?: MemberRow[];
    error?: string;
  };

  const members: MemberRow[] = Array.isArray(membersPayload.members)
    ? membersPayload.members
    : [];

  const visits = summary.ok ? Number(summary.visit_count ?? 0) : 0;
  const spend = summary.ok ? Number(summary.spend_total ?? 0) : 0;
  const newMembers = summary.ok ? Number(summary.new_members ?? 0) : 0;
  const points = summary.ok ? Number(summary.points_issued ?? 0) : 0;
  const days = summary.period_days ?? 7;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Dashboard</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Last {days} days — visits, spend, and members with recent activity.
        </p>
      </div>

      {!summary.ok && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900">
          Could not load summary. Complete setup or try again.
        </p>
      )}

      <DashboardVirtualCard
        vendorId={staff.vendor_id}
        vendorName={vendorName}
        virtualCardPath={virtualCardPath}
        virtualCardPublicUrl={virtualCardPublicUrl}
        canManage={canManageCard}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-body-sm font-medium text-[var(--color-forest)]/70">
            <TrendingUp className="size-4 text-[var(--color-ember)]" aria-hidden />
            Visits
          </div>
          <p className="tabular-nums text-2xl font-bold text-[var(--color-forest)]">
            {visits}
          </p>
          <p className="text-body-sm text-[var(--color-forest)]/60">
            Completed transactions
          </p>
        </Card>
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-body-sm font-medium text-[var(--color-forest)]/70">
            <Wallet className="size-4 text-[var(--color-ember)]" aria-hidden />
            Spend
          </div>
          <p className="tabular-nums text-2xl font-bold text-[var(--color-forest)]">
            {spend.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-body-sm text-[var(--color-forest)]/60">
            Total transaction value
          </p>
        </Card>
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-body-sm font-medium text-[var(--color-forest)]/70">
            <Users className="size-4 text-[var(--color-ember)]" aria-hidden />
            New members
          </div>
          <p className="tabular-nums text-2xl font-bold text-[var(--color-forest)]">
            {newMembers}
          </p>
          <p className="text-body-sm text-[var(--color-forest)]/60">
            First-time in period
          </p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-body-sm font-medium text-[var(--color-forest)]/70">
            Points issued
          </p>
          <p className="tabular-nums text-2xl font-bold text-[var(--color-forest)]">
            {points.toLocaleString()}
          </p>
          <p className="text-body-sm text-[var(--color-forest)]/60">
            Cleared point ledger deltas
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-4">Members</CardTitle>
        {members.length === 0 ? (
          <p className="text-body-sm text-[var(--color-forest)]/70">
            No member activity yet. When customers earn at your locations, they
            will appear here with phone-first identifiers.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-body-sm">
              <thead>
                <tr className="border-b border-[var(--color-forest)]/10 text-label text-[var(--color-forest)]/70">
                  <th className="py-2 pr-4 font-semibold">Phone</th>
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold tabular-nums">Balance</th>
                  <th className="py-2 font-semibold">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.user_id}
                    className="border-b border-[var(--color-mist)]/80"
                  >
                    <td className="py-3 pr-4 font-medium tabular-nums text-[var(--color-forest)]">
                      {m.phone_e164
                        ? maskPhoneE164(m.phone_e164)
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-[var(--color-forest)]/85">
                      {m.display_name ?? "—"}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-[var(--color-forest)]">
                      {Number(m.balance).toLocaleString()}
                    </td>
                    <td className="py-3 text-[var(--color-forest)]/80">
                      {new Date(m.last_visit).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
