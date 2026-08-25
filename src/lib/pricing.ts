/**
 * Price conversions between the two ways London short-lets are commonly quoted.
 * We use the standard 52.1786 weeks/year (365.25 / 7) convention so monthly<->weekly
 * round-trips are consistent regardless of which figure was the source.
 */
const WEEKS_PER_MONTH = 52.1786 / 12;

export function weeklyToMonthly(weekly: number): number {
  return round2(weekly * WEEKS_PER_MONTH);
}

export function monthlyToWeekly(monthly: number): number {
  return round2(monthly / WEEKS_PER_MONTH);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface PriceFigures {
  priceMonthly?: number | null;
  priceWeekly?: number | null;
}

/**
 * Returns the best-known monthly and weekly figures, deriving whichever is
 * missing from the one that is present. Never overwrites a stated figure —
 * if both are present they are returned as-is even if they don't reconcile
 * exactly (callers should flag that separately, see `priceConflict`).
 */
export function resolvePriceFigures(input: PriceFigures): {
  monthly: number | null;
  weekly: number | null;
} {
  const { priceMonthly, priceWeekly } = input;
  if (priceMonthly != null && priceWeekly != null) {
    return { monthly: priceMonthly, weekly: priceWeekly };
  }
  if (priceMonthly != null) {
    return { monthly: priceMonthly, weekly: monthlyToWeekly(priceMonthly) };
  }
  if (priceWeekly != null) {
    return { monthly: weeklyToMonthly(priceWeekly), weekly: priceWeekly };
  }
  return { monthly: null, weekly: null };
}

/** Flags when stated monthly and weekly figures disagree by more than a small tolerance. */
export function priceConflict(input: PriceFigures, toleranceFraction = 0.03): boolean {
  const { priceMonthly, priceWeekly } = input;
  if (priceMonthly == null || priceWeekly == null) return false;
  const derivedMonthly = weeklyToMonthly(priceWeekly);
  const diff = Math.abs(derivedMonthly - priceMonthly);
  return diff / priceMonthly > toleranceFraction;
}

export function formatGBP(amount: number | null | undefined, opts?: { decimals?: number }): string {
  if (amount == null || Number.isNaN(amount)) return "Not stated";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: opts?.decimals ?? 0,
    minimumFractionDigits: 0,
  }).format(amount);
}
