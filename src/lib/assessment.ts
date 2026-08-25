import type { Property } from "@prisma/client";

/** Short, human display name for a property: development name if known, else the first address segment. */
export function shortName(property: Pick<Property, "address" | "development">): string {
  if (property.development && property.development.trim()) return property.development.trim();
  const firstSegment = property.address.split(",")[0]?.trim();
  return firstSegment || property.address;
}

function openWatchOut(p: Property): string | null {
  if (p.shortLetConfirmed !== "YES") return "its short-let terms confirmed";
  if (p.billsIncluded === "UNKNOWN") return "the bills package confirmed";
  if (p.wifiIncluded === "UNKNOWN") return "broadband confirmed";
  if (!p.lastVerifiedAt) return "the listing re-verified";
  if (p.watchOuts && p.watchOuts.trim()) {
    const firstClause = p.watchOuts.split(/[.;]/)[0]?.trim();
    if (firstClause) return firstClause.charAt(0).toLowerCase() + firstClause.slice(1);
  }
  return null;
}

/** Built only from structured fields — never inserts raw free-text notes mid-sentence. */
function topDescriptor(p: Property): string {
  const parts: string[] = [];
  if (p.squareFeet) parts.push("space-and-value");
  else if (p.priceMonthly) parts.push("value");
  if (p.wfhSuitable === "YES" && !parts.includes("space-and-value")) parts.push("WFH-friendly");
  const label = parts.length ? `${parts.join(" and ")} option` : "option";
  return p.squareFeet ? `${label} at ${p.squareFeet.toLocaleString("en-GB")} sq ft` : label;
}

/**
 * Generates a short estate-agent-style assessment paragraph purely from
 * structured property fields — never hard-codes a property name.
 */
export function generateAssessment(properties: Property[]): string {
  const active = properties.filter((p) => !["RULED_OUT", "UNAVAILABLE", "DUPLICATE", "LET_AGREED"].includes(p.status));
  if (active.length === 0) {
    return "No active contenders yet — add properties to the pipeline to get a running assessment.";
  }

  const ranked = [...active]
    .filter((p) => p.rankTier)
    .sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0));

  const topPick = ranked.find((p) => p.rankTier === "TOP_PICK") ?? ranked[0];
  if (!topPick) {
    return `${active.length} propert${active.length === 1 ? "y is" : "ies are"} in play, none ranked yet — set a tier on your strongest options to see a running assessment here.`;
  }

  const sentences: string[] = [];
  sentences.push(`${shortName(topPick)} is currently the strongest ${topDescriptor(topPick)}`);

  const runnerUp = ranked.find(
    (p) => p.id !== topPick.id && ["STRONG_CONTENDER", "WORTH_CONSIDERING", "CONDITIONAL"].includes(p.rankTier ?? "")
  );
  if (runnerUp) {
    const watchOut = openWatchOut(runnerUp);
    if (watchOut) {
      sentences.push(`${shortName(runnerUp)} remains promising but needs ${watchOut}`);
    } else {
      sentences.push(`${shortName(runnerUp)} remains a close second`);
    }
  }

  return sentences.join("; ") + ".";
}
