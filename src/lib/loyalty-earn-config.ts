/**
 * Optional components layered on top of base spend → points mapping.
 * Ledger/POS applies these when crediting points.
 */
export type MetricToggle<T extends Record<string, number>> = {
  enabled: boolean;
} & T;

export type LoyaltyEarnConfig = {
  minimum_spend_for_earn?: MetricToggle<{ amount: number }>;
  max_points_per_transaction?: MetricToggle<{ cap: number }>;
  flat_bonus_per_transaction?: MetricToggle<{ points: number }>;
  first_visit_of_day_bonus?: MetricToggle<{ points: number }>;
};

export const EMPTY_EARN_CONFIG: LoyaltyEarnConfig = {};

export function parseEarnConfig(raw: unknown): LoyaltyEarnConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const out: LoyaltyEarnConfig = {};

  const min = o.minimum_spend_for_earn;
  if (min && typeof min === "object" && !Array.isArray(min)) {
    const m = min as Record<string, unknown>;
    out.minimum_spend_for_earn = {
      enabled: Boolean(m.enabled),
      amount: clampNonNegNum(m.amount, 0),
    };
  }

  const max = o.max_points_per_transaction;
  if (max && typeof max === "object" && !Array.isArray(max)) {
    const m = max as Record<string, unknown>;
    out.max_points_per_transaction = {
      enabled: Boolean(m.enabled),
      cap: clampNonNegNum(m.cap, 0),
    };
  }

  const flat = o.flat_bonus_per_transaction;
  if (flat && typeof flat === "object" && !Array.isArray(flat)) {
    const m = flat as Record<string, unknown>;
    out.flat_bonus_per_transaction = {
      enabled: Boolean(m.enabled),
      points: clampNonNegNum(m.points, 0),
    };
  }

  const fv = o.first_visit_of_day_bonus;
  if (fv && typeof fv === "object" && !Array.isArray(fv)) {
    const m = fv as Record<string, unknown>;
    out.first_visit_of_day_bonus = {
      enabled: Boolean(m.enabled),
      points: clampNonNegNum(m.points, 0),
    };
  }

  return out;
}

function clampNonNegNum(v: unknown, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export function earnConfigFromFormData(fd: FormData): LoyaltyEarnConfig {
  const cfg: LoyaltyEarnConfig = {};

  if (fd.get("opt_min_spend_enabled") === "on") {
    cfg.minimum_spend_for_earn = {
      enabled: true,
      amount: Math.max(0, Number(fd.get("opt_min_spend_amount") ?? 0)),
    };
  }

  if (fd.get("opt_max_points_enabled") === "on") {
    cfg.max_points_per_transaction = {
      enabled: true,
      cap: Math.max(0, Number(fd.get("opt_max_points_cap") ?? 0)),
    };
  }

  if (fd.get("opt_flat_bonus_enabled") === "on") {
    cfg.flat_bonus_per_transaction = {
      enabled: true,
      points: Math.max(0, Number(fd.get("opt_flat_bonus_points") ?? 0)),
    };
  }

  if (fd.get("opt_first_visit_enabled") === "on") {
    cfg.first_visit_of_day_bonus = {
      enabled: true,
      points: Math.max(0, Number(fd.get("opt_first_visit_points") ?? 0)),
    };
  }

  return cfg;
}

export function validateEarnConfig(cfg: LoyaltyEarnConfig): string | null {
  if (cfg.minimum_spend_for_earn?.enabled) {
    if (!(cfg.minimum_spend_for_earn.amount > 0)) {
      return "Minimum spend must be greater than zero when enabled.";
    }
  }
  if (cfg.max_points_per_transaction?.enabled) {
    if (!(cfg.max_points_per_transaction.cap > 0)) {
      return "Maximum points per transaction must be greater than zero when enabled.";
    }
  }
  if (cfg.flat_bonus_per_transaction?.enabled) {
    if (!(cfg.flat_bonus_per_transaction.points > 0)) {
      return "Flat bonus must be greater than zero when enabled.";
    }
  }
  if (cfg.first_visit_of_day_bonus?.enabled) {
    if (!(cfg.first_visit_of_day_bonus.points > 0)) {
      return "First visit of day bonus must be greater than zero when enabled.";
    }
  }
  return null;
}

export function describeEarnStructure(input: {
  earn_rate: number;
  earn_per_currency_units: number;
  points_name: string;
  earn_config: LoyaltyEarnConfig;
}): string[] {
  const unit = input.earn_per_currency_units;
  const rate = input.earn_rate;
  const label = input.points_name.trim() || "points";
  const lines: string[] = [];

  lines.push(
    `Base earn: ${rate.toLocaleString()} ${label} per ${unit.toLocaleString()} in eligible spend (your default currency).`,
  );

  const c = input.earn_config;
  if (c.minimum_spend_for_earn?.enabled) {
    lines.push(
      `Eligible spend must reach at least ${c.minimum_spend_for_earn.amount.toLocaleString()} before spend-based ${label} apply.`,
    );
  }
  if (c.flat_bonus_per_transaction?.enabled) {
    lines.push(
      `Add ${c.flat_bonus_per_transaction.points.toLocaleString()} ${label} per qualifying earn event (on top of spend-based ${label}).`,
    );
  }
  if (c.first_visit_of_day_bonus?.enabled) {
    lines.push(
      `Add ${c.first_visit_of_day_bonus.points.toLocaleString()} ${label} when the member’s first visit of the day qualifies (requires POS support).`,
    );
  }
  if (c.max_points_per_transaction?.enabled) {
    lines.push(
      `Cap total ${label} from a single transaction at ${c.max_points_per_transaction.cap.toLocaleString()}.`,
    );
  }

  return lines;
}
