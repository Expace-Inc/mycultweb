import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  describeEarnStructure,
  earnConfigFromFormData,
  parseEarnConfig,
  validateEarnConfig,
  type LoyaltyEarnConfig,
} from "@/lib/loyalty-earn-config";
import Link from "next/link";
import { redirect } from "next/navigation";

type LoyaltyRow = {
  id: string;
  vendor_id: string;
  name: string;
  points_name: string;
  earn_rate: number;
  earn_per_currency_units?: number | null;
  earn_config?: unknown;
  is_active: boolean;
};

function num(fd: FormData, key: string, fallback: number) {
  const v = Number(fd.get(key));
  return Number.isFinite(v) ? v : fallback;
}

function ProgrammeIdentityFields({
  defaultName,
  defaultPointsLabel,
}: {
  defaultName: string;
  defaultPointsLabel: string;
}) {
  return (
    <fieldset className="flex flex-col gap-4 border-0 p-0">
      <legend className="sr-only">Programme identity</legend>
      <div className="text-label font-semibold uppercase tracking-wide text-[var(--color-forest)]/70">
        Identity
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Programme name</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="points_name">Points label</Label>
        <Input
          id="points_name"
          name="points_name"
          defaultValue={defaultPointsLabel}
          required
          placeholder="Points, Stars, Miles…"
        />
      </div>
    </fieldset>
  );
}

function ProgrammeSpendRuleFields({
  defaultEarnRate,
  defaultPerCurrencyUnits,
}: {
  defaultEarnRate: number;
  defaultPerCurrencyUnits: number;
}) {
  return (
    <fieldset className="flex flex-col gap-4 border-0 p-0">
      <legend className="sr-only">Spend-based points</legend>
      <div className="text-label font-semibold uppercase tracking-wide text-[var(--color-forest)]/70">
        Points from money spent
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="earn_rate">Points awarded</Label>
          <Input
            id="earn_rate"
            name="earn_rate"
            type="number"
            step="any"
            min="0"
            defaultValue={defaultEarnRate}
            required
            className="tabular-nums w-full"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="earn_per_currency_units">Per this much spend</Label>
          <Input
            id="earn_per_currency_units"
            name="earn_per_currency_units"
            type="number"
            step="any"
            min="0.0001"
            defaultValue={defaultPerCurrencyUnits}
            required
            className="tabular-nums w-full"
          />
        </div>
      </div>
    </fieldset>
  );
}

function ProgrammeOptionalMetricsFields({
  config,
}: {
  config: LoyaltyEarnConfig;
}) {
  const min = config.minimum_spend_for_earn;
  const max = config.max_points_per_transaction;
  const flat = config.flat_bonus_per_transaction;
  const first = config.first_visit_of_day_bonus;

  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0">
      <legend className="sr-only">Optional earn metrics</legend>
      <div>
        <div className="text-label font-semibold uppercase tracking-wide text-[var(--color-forest)]/70">
          Optional metrics
        </div>
        <p className="mt-1 text-body-sm text-[var(--color-forest)]/65">
          Toggle only what you plan to enforce. Each rule is stored on the
          programme and can be combined with the base spend rate when your POS
          or backend calculates points.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-forest)]/10 bg-[var(--color-mist)]/20 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <input
            id="opt_min_spend_enabled"
            name="opt_min_spend_enabled"
            type="checkbox"
            value="on"
            defaultChecked={min?.enabled}
            className="mt-1 size-4 shrink-0 rounded border-[var(--color-forest)]/30"
          />
          <div className="min-w-0 flex-1">
            <Label htmlFor="opt_min_spend_enabled" className="font-semibold">
              Minimum spend before earn
            </Label>
            <p className="mt-0.5 text-body-sm text-[var(--color-forest)]/65">
              Spend-based points only apply after this basket total in one
              transaction.
            </p>
            <div className="mt-2 max-w-xs">
              <Label htmlFor="opt_min_spend_amount" className="sr-only">
                Minimum amount
              </Label>
              <Input
                id="opt_min_spend_amount"
                name="opt_min_spend_amount"
                type="number"
                step="any"
                min="0"
                defaultValue={min?.amount ?? ""}
                placeholder="e.g. 500"
                className="tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-forest)]/10 bg-[var(--color-mist)]/20 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <input
            id="opt_flat_bonus_enabled"
            name="opt_flat_bonus_enabled"
            type="checkbox"
            value="on"
            defaultChecked={flat?.enabled}
            className="mt-1 size-4 shrink-0 rounded border-[var(--color-forest)]/30"
          />
          <div className="min-w-0 flex-1">
            <Label htmlFor="opt_flat_bonus_enabled" className="font-semibold">
              Flat bonus per earn event
            </Label>
            <p className="mt-0.5 text-body-sm text-[var(--color-forest)]/65">
              Extra points added once per qualifying earn (e.g. each settled
              visit), on top of spend-based points.
            </p>
            <div className="mt-2 max-w-xs">
              <Label htmlFor="opt_flat_bonus_points" className="sr-only">
                Bonus points
              </Label>
              <Input
                id="opt_flat_bonus_points"
                name="opt_flat_bonus_points"
                type="number"
                step="any"
                min="0"
                defaultValue={flat?.points ?? ""}
                placeholder="e.g. 10"
                className="tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-forest)]/10 bg-[var(--color-mist)]/20 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <input
            id="opt_first_visit_enabled"
            name="opt_first_visit_enabled"
            type="checkbox"
            value="on"
            defaultChecked={first?.enabled}
            className="mt-1 size-4 shrink-0 rounded border-[var(--color-forest)]/30"
          />
          <div className="min-w-0 flex-1">
            <Label htmlFor="opt_first_visit_enabled" className="font-semibold">
              First visit of the day bonus
            </Label>
            <p className="mt-0.5 text-body-sm text-[var(--color-forest)]/65">
              Extra points when a member’s first qualifying visit of a calendar
              day posts — requires POS or integration to detect “first visit”.
            </p>
            <div className="mt-2 max-w-xs">
              <Label htmlFor="opt_first_visit_points" className="sr-only">
                Bonus points
              </Label>
              <Input
                id="opt_first_visit_points"
                name="opt_first_visit_points"
                type="number"
                step="any"
                min="0"
                defaultValue={first?.points ?? ""}
                placeholder="e.g. 5"
                className="tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-forest)]/10 bg-[var(--color-mist)]/20 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <input
            id="opt_max_points_enabled"
            name="opt_max_points_enabled"
            type="checkbox"
            value="on"
            defaultChecked={max?.enabled}
            className="mt-1 size-4 shrink-0 rounded border-[var(--color-forest)]/30"
          />
          <div className="min-w-0 flex-1">
            <Label htmlFor="opt_max_points_enabled" className="font-semibold">
              Maximum points per transaction
            </Label>
            <p className="mt-0.5 text-body-sm text-[var(--color-forest)]/65">
              Upper bound on total points from one transaction after combining
              spend and bonuses.
            </p>
            <div className="mt-2 max-w-xs">
              <Label htmlFor="opt_max_points_cap" className="sr-only">
                Point cap
              </Label>
              <Input
                id="opt_max_points_cap"
                name="opt_max_points_cap"
                type="number"
                step="any"
                min="0"
                defaultValue={max?.cap ?? ""}
                placeholder="e.g. 500"
                className="tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  );
}

const linkBtnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label font-semibold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember)] border border-[var(--color-forest)]/20 bg-white text-[var(--color-forest)] hover:bg-[var(--color-mist)]/40";

const linkBtnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label font-semibold tracking-wide text-[var(--color-forest)] transition-colors hover:bg-[var(--color-mist)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember)]";

function ProgrammeFeedbackBanner({
  saved,
  error,
}: {
  saved?: string;
  error?: string;
}) {
  if (saved === "1") {
    return (
      <p
        className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-body-sm text-green-900"
        role="status"
      >
        Programme saved. Your rules are stored and ready for checkout or POS
        integrations.
      </p>
    );
  }
  if (error === "forbidden") {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900">
        You do not have permission to change this programme.
      </p>
    );
  }
  if (error === "invalid") {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900">
        Check the form: required fields must be filled and optional rules need
        valid numbers when enabled.
      </p>
    );
  }
  if (error === "save") {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-900">
        Could not save to the database. Try again in a moment.
      </p>
    );
  }
  return null;
}

export default async function ProgrammeSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
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

  const { data: programRaw } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("vendor_id", staff.vendor_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const program = programRaw as LoyaltyRow | null;
  const earnPerUnit =
    program?.earn_per_currency_units != null &&
    Number(program.earn_per_currency_units) > 0
      ? Number(program.earn_per_currency_units)
      : 1;
  const earnConfig = parseEarnConfig(program?.earn_config);

  async function createProgram(formData: FormData) {
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
      redirect("/settings/programme?error=forbidden");
    }

    const name = String(formData.get("name") ?? "").trim() || "Loyalty";
    const points_name = String(formData.get("points_name") ?? "").trim() || "Points";
    const earn_rate = num(formData, "earn_rate", 1);
    const earn_per_currency_units = num(formData, "earn_per_currency_units", 1);
    const cfg = earnConfigFromFormData(formData);
    const cfgErr = validateEarnConfig(cfg);
    if (cfgErr) {
      redirect("/settings/programme?error=invalid");
    }
    if (
      !name ||
      !points_name ||
      earn_rate < 0 ||
      !(earn_per_currency_units > 0)
    ) {
      redirect("/settings/programme?error=invalid");
    }

    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "upsert_loyalty_program",
      {
        p_name: name,
        p_points_name: points_name,
        p_earn_rate: earn_rate,
        p_earn_per_currency_units: earn_per_currency_units,
        p_earn_config: cfg,
        p_is_active: true,
        p_program_id: null,
      },
    );

    if (rpcErr) {
      console.error("upsert_loyalty_program", rpcErr);
      redirect("/settings/programme?error=save");
    }

    const payload = (rpcData ?? {}) as { ok?: boolean; error?: string };
    if (payload.ok === false) {
      console.error("upsert_loyalty_program", payload);
      redirect("/settings/programme?error=save");
    }

    redirect("/settings/programme?saved=1");
  }

  async function saveProgram(formData: FormData) {
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
      redirect("/settings/programme?error=forbidden");
    }

    const id = String(formData.get("program_id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const points_name = String(formData.get("points_name") ?? "").trim();
    const earn_rate = num(formData, "earn_rate", 0);
    const earn_per_currency_units = num(formData, "earn_per_currency_units", 1);
    const is_active = formData.get("is_active") === "true";
    const cfg = earnConfigFromFormData(formData);
    const cfgErr = validateEarnConfig(cfg);

    if (
      !id ||
      !name ||
      !points_name ||
      earn_rate < 0 ||
      !(earn_per_currency_units > 0) ||
      cfgErr
    ) {
      redirect("/settings/programme?edit=1&error=invalid");
    }

    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "upsert_loyalty_program",
      {
        p_name: name,
        p_points_name: points_name,
        p_earn_rate: earn_rate,
        p_earn_per_currency_units: earn_per_currency_units,
        p_earn_config: cfg,
        p_is_active: is_active,
        p_program_id: id,
      },
    );

    if (rpcErr) {
      console.error("upsert_loyalty_program", rpcErr);
      redirect("/settings/programme?edit=1&error=save");
    }

    const payload = (rpcData ?? {}) as { ok?: boolean; error?: string };
    if (payload.ok === false) {
      console.error("upsert_loyalty_program", payload);
      redirect("/settings/programme?edit=1&error=save");
    }

    redirect("/settings/programme?saved=1");
  }

  const summaryLines =
    program &&
    describeEarnStructure({
      earn_rate: Number(program.earn_rate),
      earn_per_currency_units: earnPerUnit,
      points_name: program.points_name,
      earn_config: earnConfig,
    });

  const showEditForm =
    Boolean(program) && canEdit && params.edit === "1";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Points & rules</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Define how members earn from spend, then layer optional rules your POS
          or ledger can honour (minimums, caps, bonuses).
        </p>
      </div>

      <ProgrammeFeedbackBanner saved={params.saved} error={params.error} />

      {!program ? (
        <Card>
          <CardTitle className="mb-2">Create programme</CardTitle>
          <p className="mb-6 text-body-sm text-[var(--color-forest)]/75">
            Start with a clear base rate (points per block of money spent). You
            can refine optional metrics now or after launch.
          </p>
          {canEdit ? (
            <form action={createProgram} className="flex flex-col gap-8">
              <ProgrammeIdentityFields
                defaultName="Loyalty"
                defaultPointsLabel="Points"
              />
              <ProgrammeSpendRuleFields
                defaultEarnRate={1}
                defaultPerCurrencyUnits={1}
              />
              <ProgrammeOptionalMetricsFields config={earnConfig} />
              <Button type="submit" className="w-fit">
                Create programme
              </Button>
            </form>
          ) : (
            <p className="text-body-sm text-[var(--color-forest)]/70">
              Only owners and managers can create the programme.
            </p>
          )}
        </Card>
      ) : showEditForm ? (
        <Card>
          <div className="mb-6 flex flex-col gap-3 border-b border-[var(--color-forest)]/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="mb-1">Edit programme</CardTitle>
              <p className="text-body-sm text-[var(--color-forest)]/70">
                Update identity, earn rate, optional metrics, or pause the
                programme.
              </p>
            </div>
            <Link href="/settings/programme" className={cn(linkBtnGhost, "shrink-0")}>
              Back to overview
            </Link>
          </div>
          <form action={saveProgram} className="flex flex-col gap-8">
            <input type="hidden" name="program_id" value={program.id} />
            <ProgrammeIdentityFields
              defaultName={program.name}
              defaultPointsLabel={program.points_name}
            />
            <ProgrammeSpendRuleFields
              defaultEarnRate={Number(program.earn_rate)}
              defaultPerCurrencyUnits={earnPerUnit}
            />
            <ProgrammeOptionalMetricsFields config={earnConfig} />
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                value="true"
                defaultChecked={program.is_active}
                className="size-4 rounded border-[var(--color-forest)]/30"
              />
              <Label htmlFor="is_active" className="font-normal">
                Programme active (paused programmes may block earns in your POS
                flows)
              </Label>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Save changes</Button>
              <Link href="/settings/programme" className={linkBtnSecondary}>
                Cancel
              </Link>
            </div>
          </form>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-forest)]/12 bg-white p-6 shadow-[0_1px_0_rgb(255_255_255/0.8)_inset] sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-label font-semibold uppercase tracking-wide text-[var(--color-forest)]/55">
                Programme
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-forest)]">
                {program.name}
              </h2>
              <p className="mt-2 text-body-sm text-[var(--color-forest)]/75">
                Members collect{" "}
                <span className="font-semibold text-[var(--color-forest)]">
                  {program.points_name}
                </span>{" "}
                using the earning structure below. Checkout and POS should read
                these rules when posting points.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full px-3 py-1 text-label font-semibold",
                  program.is_active
                    ? "bg-green-100 text-green-900"
                    : "bg-[var(--color-mist)]/80 text-[var(--color-forest)]/80",
                )}
              >
                {program.is_active ? "Active" : "Paused"}
              </span>
              {canEdit ? (
                <Link href="/settings/programme?edit=1" className={linkBtnSecondary}>
                  Edit programme
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardTitle className="mb-4 text-body font-semibold">
                At a glance
              </CardTitle>
              <dl className="flex flex-col gap-3 text-body-sm">
                <div>
                  <dt className="text-label text-[var(--color-forest)]/60">
                    Points label
                  </dt>
                  <dd className="font-semibold text-[var(--color-forest)]">
                    {program.points_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-[var(--color-forest)]/60">
                    Status
                  </dt>
                  <dd className="font-semibold text-[var(--color-forest)]">
                    {program.is_active ? "Earning enabled" : "Paused"}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="lg:col-span-2">
              <CardTitle className="mb-4 text-body font-semibold">
                Base earn from spend
              </CardTitle>
              <p className="text-body-sm text-[var(--color-forest)]/70">
                Primary rule: award points from eligible transaction totals.
              </p>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="tabular-nums text-4xl font-bold text-[var(--color-forest)]">
                  {Number(program.earn_rate).toLocaleString()}
                </span>
                <span className="text-body font-medium text-[var(--color-forest)]/80">
                  {program.points_name}
                </span>
                <span className="text-body-sm text-[var(--color-forest)]/65">
                  per
                </span>
                <span className="tabular-nums text-2xl font-bold text-[var(--color-forest)]">
                  {earnPerUnit.toLocaleString()}
                </span>
                <span className="text-body-sm text-[var(--color-forest)]/65">
                  in eligible spend
                </span>
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle className="mb-3">Full rule summary</CardTitle>
            <ul className="list-inside list-disc space-y-2 text-body-sm text-[var(--color-forest)]/85">
              {summaryLines?.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {!canEdit && (
              <p className="mt-4 text-body-sm text-[var(--color-forest)]/60">
                Ask an owner or manager if you need to change these settings.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
