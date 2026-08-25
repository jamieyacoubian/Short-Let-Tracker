import { describe, expect, it } from "vitest";
import { formatGBP, monthlyToWeekly, priceConflict, resolvePriceFigures, weeklyToMonthly } from "./pricing";

describe("weeklyToMonthly / monthlyToWeekly", () => {
  it("round-trips within a penny", () => {
    const weekly = 800;
    const monthly = weeklyToMonthly(weekly);
    const back = monthlyToWeekly(monthly);
    expect(Math.abs(back - weekly)).toBeLessThan(0.01);
  });

  it("converts a known monthly figure to the expected weekly figure", () => {
    // 3500 / (52.1786 / 12) using the standard weeks-per-month convention.
    expect(monthlyToWeekly(3500)).toBeCloseTo(804.93, 1);
  });
});

describe("resolvePriceFigures", () => {
  it("derives the weekly figure when only monthly is known", () => {
    const result = resolvePriceFigures({ priceMonthly: 3000 });
    expect(result.monthly).toBe(3000);
    expect(result.weekly).toBeCloseTo(monthlyToWeekly(3000));
  });

  it("derives the monthly figure when only weekly is known", () => {
    const result = resolvePriceFigures({ priceWeekly: 700 });
    expect(result.weekly).toBe(700);
    expect(result.monthly).toBeCloseTo(weeklyToMonthly(700));
  });

  it("returns nulls when neither figure is known", () => {
    expect(resolvePriceFigures({})).toEqual({ monthly: null, weekly: null });
  });

  it("never overwrites two stated figures even if they don't reconcile", () => {
    const result = resolvePriceFigures({ priceMonthly: 3000, priceWeekly: 800 });
    expect(result.monthly).toBe(3000);
    expect(result.weekly).toBe(800);
  });
});

describe("priceConflict", () => {
  it("is false when only one figure is known", () => {
    expect(priceConflict({ priceMonthly: 3000 })).toBe(false);
  });

  it("is false when the two figures reconcile within tolerance", () => {
    const monthly = 3000;
    const weekly = monthlyToWeekly(monthly);
    expect(priceConflict({ priceMonthly: monthly, priceWeekly: weekly })).toBe(false);
  });

  it("flags a clear mismatch between stated monthly and weekly figures", () => {
    expect(priceConflict({ priceMonthly: 3000, priceWeekly: 1000 })).toBe(true);
  });
});

describe("formatGBP", () => {
  it("formats a whole-pound amount without decimals", () => {
    expect(formatGBP(3500)).toBe("£3,500");
  });

  it("shows 'Not stated' for null or undefined", () => {
    expect(formatGBP(null)).toBe("Not stated");
    expect(formatGBP(undefined)).toBe("Not stated");
  });
});
