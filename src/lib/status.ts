import type { PropertyStatus, RankTier, Tristate } from "@prisma/client";

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  NEW: "New / needs verification",
  READY_TO_ENQUIRE: "Ready to enquire",
  ENQUIRY_SENT: "Enquiry sent",
  AWAITING_REPLY: "Awaiting reply",
  ACTIVE_CONVERSATION: "Active conversation",
  VIEWING_ARRANGED: "Viewing arranged",
  STRONG_CONTENDER: "Strong contender",
  FOLLOW_UP_DUE: "Follow-up due",
  HOLD: "Hold",
  UNAVAILABLE: "Unavailable",
  RULED_OUT: "Ruled out",
  LET_AGREED: "Let agreed",
  DUPLICATE: "Duplicate",
};

/** Kanban column order. */
export const STATUS_ORDER: PropertyStatus[] = [
  "NEW",
  "READY_TO_ENQUIRE",
  "ENQUIRY_SENT",
  "AWAITING_REPLY",
  "ACTIVE_CONVERSATION",
  "VIEWING_ARRANGED",
  "STRONG_CONTENDER",
  "FOLLOW_UP_DUE",
  "HOLD",
  "UNAVAILABLE",
  "RULED_OUT",
  "LET_AGREED",
  "DUPLICATE",
];

/** Statuses that represent a property no longer being actively pursued. */
export const CLOSED_STATUSES: PropertyStatus[] = ["UNAVAILABLE", "RULED_OUT", "LET_AGREED", "DUPLICATE"];

export const ACTIVE_STATUSES: PropertyStatus[] = STATUS_ORDER.filter(
  (s) => !CLOSED_STATUSES.includes(s)
);

export const RANK_LABEL: Record<RankTier, string> = {
  TOP_PICK: "Top Pick",
  STRONG_CONTENDER: "Strong Contender",
  WORTH_CONSIDERING: "Worth Considering",
  CONDITIONAL: "Conditional",
  HOLD_VERIFY: "Hold / Verify",
  RULED_OUT: "Ruled Out",
}

export const RANK_ORDER: RankTier[] = [
  "TOP_PICK",
  "STRONG_CONTENDER",
  "WORTH_CONSIDERING",
  "CONDITIONAL",
  "HOLD_VERIFY",
  "RULED_OUT",
];

export type StatusColor = "sage" | "terracotta" | "amber" | "clay" | "ink" | "default";

export const STATUS_COLOR: Record<PropertyStatus, StatusColor> = {
  NEW: "ink",
  READY_TO_ENQUIRE: "sage",
  ENQUIRY_SENT: "sage",
  AWAITING_REPLY: "amber",
  ACTIVE_CONVERSATION: "sage",
  VIEWING_ARRANGED: "terracotta",
  STRONG_CONTENDER: "sage",
  FOLLOW_UP_DUE: "amber",
  HOLD: "ink",
  UNAVAILABLE: "clay",
  RULED_OUT: "clay",
  LET_AGREED: "clay",
  DUPLICATE: "clay",
};

export const RANK_COLOR: Record<RankTier, StatusColor> = {
  TOP_PICK: "terracotta",
  STRONG_CONTENDER: "sage",
  WORTH_CONSIDERING: "sage",
  CONDITIONAL: "amber",
  HOLD_VERIFY: "amber",
  RULED_OUT: "clay",
};

export function tristateLabel(value: Tristate | null | undefined): string {
  if (value === "YES") return "Yes";
  if (value === "NO") return "No";
  return "Unknown";
}

export function tristateColor(value: Tristate | null | undefined): StatusColor {
  if (value === "YES") return "sage";
  if (value === "NO") return "clay";
  return "ink";
}

/** "Not stated" (never captured) is visually and semantically distinct from an explicit "No". */
export function notStatedOr(value: string | null | undefined, fallback = "Not stated — confirm with agent"): string {
  if (value == null || value.trim() === "") return fallback;
  return value;
}

export interface UrgencyInput {
  status: PropertyStatus;
  nextActionDue?: Date | null;
  updatedAt: Date;
}

/**
 * Lower = more urgent. Used to order the dashboard's immediate-action list.
 * An overdue next action always outranks anything without one; among those,
 * the most overdue sorts first. Items with a future due date sort by how
 * soon that date is. Items with no due date fall back to a per-status
 * urgency band.
 */
export function urgencyScore(input: UrgencyInput, now: Date = new Date()): number {
  const { status, nextActionDue } = input;
  if (nextActionDue) {
    const daysUntilDue = (nextActionDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilDue <= 0) {
      // Overdue: base band well below any non-overdue score, more overdue = lower (more urgent).
      return -1_000_000 + daysUntilDue;
    }
    return daysUntilDue * 100;
  }
  const statusUrgency: Partial<Record<PropertyStatus, number>> = {
    FOLLOW_UP_DUE: -500,
    VIEWING_ARRANGED: -200,
    READY_TO_ENQUIRE: 500,
    AWAITING_REPLY: 1000,
    ACTIVE_CONVERSATION: 2000,
  };
  return statusUrgency[status] ?? 10000;
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Excellent"];
export function ratingLabel(value: number | null | undefined): string {
  if (value == null || value < 1 || value > 4) return "Not rated";
  return RATING_LABELS[value];
}

const STALE_AFTER_DAYS = 10;

/**
 * A listing is "stale" once it hasn't been re-verified in a while, or its
 * own status note suggests it's been pulled — surfaced as a warning badge
 * rather than silently trusted.
 */
export function isStaleListing(
  input: { lastVerifiedAt: Date | null; listingStatusNote?: string | null },
  now: Date = new Date()
): boolean {
  if (input.listingStatusNote) {
    const low = input.listingStatusNote.toLowerCase();
    if (low.includes("removed") || low.includes("no longer") || low.includes("unavailable")) return true;
  }
  if (!input.lastVerifiedAt) return true;
  const days = (now.getTime() - input.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24);
  return days > STALE_AFTER_DAYS;
}
