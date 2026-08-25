import { describe, expect, it } from "vitest";
import { isStaleListing, notStatedOr, ratingLabel, tristateColor, tristateLabel, urgencyScore } from "./status";

describe("tristateLabel / tristateColor", () => {
  it("distinguishes an explicit No from Unknown", () => {
    expect(tristateLabel("NO")).toBe("No");
    expect(tristateLabel("UNKNOWN")).toBe("Unknown");
    expect(tristateLabel("YES")).toBe("Yes");
  });

  it("colours No and Unknown differently", () => {
    expect(tristateColor("NO")).not.toBe(tristateColor("UNKNOWN"));
  });
});

describe("notStatedOr", () => {
  it("falls back to the 'not stated' message for null, undefined or empty", () => {
    expect(notStatedOr(null)).toMatch(/not stated/i);
    expect(notStatedOr(undefined)).toMatch(/not stated/i);
    expect(notStatedOr("   ")).toMatch(/not stated/i);
  });

  it("passes through a real value untouched", () => {
    expect(notStatedOr("Furnished")).toBe("Furnished");
  });
});

describe("ratingLabel", () => {
  it("maps 1-4 to Poor..Excellent", () => {
    expect(ratingLabel(1)).toBe("Poor");
    expect(ratingLabel(2)).toBe("Fair");
    expect(ratingLabel(3)).toBe("Good");
    expect(ratingLabel(4)).toBe("Excellent");
  });

  it("treats missing or out-of-range ratings as Not rated", () => {
    expect(ratingLabel(null)).toBe("Not rated");
    expect(ratingLabel(undefined)).toBe("Not rated");
    expect(ratingLabel(0)).toBe("Not rated");
    expect(ratingLabel(5)).toBe("Not rated");
  });
});

describe("urgencyScore", () => {
  const now = new Date("2026-08-25T09:00:00Z");

  it("ranks an overdue next action ahead of everything else", () => {
    const overdue = urgencyScore({ status: "HOLD", nextActionDue: new Date("2026-08-20T09:00:00Z"), updatedAt: now }, now);
    const dueSoon = urgencyScore({ status: "AWAITING_REPLY", nextActionDue: new Date("2026-08-26T09:00:00Z"), updatedAt: now }, now);
    const noDueDate = urgencyScore({ status: "AWAITING_REPLY", updatedAt: now }, now);
    expect(overdue).toBeLessThan(dueSoon);
    expect(overdue).toBeLessThan(noDueDate);
  });

  it("ranks a more overdue item ahead of a less overdue one", () => {
    const veryOverdue = urgencyScore({ status: "HOLD", nextActionDue: new Date("2026-08-10T09:00:00Z"), updatedAt: now }, now);
    const slightlyOverdue = urgencyScore({ status: "HOLD", nextActionDue: new Date("2026-08-24T09:00:00Z"), updatedAt: now }, now);
    expect(veryOverdue).toBeLessThan(slightlyOverdue);
  });

  it("ranks a sooner future due date ahead of a later one", () => {
    const soon = urgencyScore({ status: "HOLD", nextActionDue: new Date("2026-08-26T09:00:00Z"), updatedAt: now }, now);
    const later = urgencyScore({ status: "HOLD", nextActionDue: new Date("2026-09-10T09:00:00Z"), updatedAt: now }, now);
    expect(soon).toBeLessThan(later);
  });
});

describe("isStaleListing", () => {
  const now = new Date("2026-08-25T09:00:00Z");

  it("is not stale when recently verified", () => {
    expect(isStaleListing({ lastVerifiedAt: new Date("2026-08-24T09:00:00Z") }, now)).toBe(false);
  });

  it("is stale when never verified", () => {
    expect(isStaleListing({ lastVerifiedAt: null }, now)).toBe(true);
  });

  it("is stale once the verification is old enough", () => {
    expect(isStaleListing({ lastVerifiedAt: new Date("2026-07-01T09:00:00Z") }, now)).toBe(true);
  });

  it("is stale when the listing status note says it was removed, regardless of verification date", () => {
    expect(
      isStaleListing({ lastVerifiedAt: new Date("2026-08-24T09:00:00Z"), listingStatusNote: "Rightmove URL removed" }, now)
    ).toBe(true);
  });
});
