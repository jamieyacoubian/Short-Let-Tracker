/**
 * Duplicate / relisting detection.
 *
 * The same home is routinely relisted under a different portal URL, a
 * slightly different address string, or through a different agency branch.
 * A different listing URL must never, by itself, be read as "different
 * property" — so URL equality is one signal among several, not a gate.
 */

export interface DuplicateCandidate {
  id?: string;
  address?: string | null;
  development?: string | null;
  postcode?: string | null;
  listingUrl?: string | null;
  additionalUrls?: string[] | null;
  reference?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
}

export interface DuplicateMatch {
  candidateId?: string;
  matchedId?: string;
  confidence: "strong" | "possible";
  score: number;
  reasons: string[];
}

export function normalizeAddress(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\b(flat|apartment|apt|unit|no\.?|number)\b/g, "")
    .replace(/[.,#'"-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePostcode(value?: string | null): string {
  if (!value) return "";
  return value.toUpperCase().replace(/\s+/g, "");
}

/**
 * The "outward" part of a UK postcode, e.g. "W9" from "W9 3HX" — useful for
 * partial matches. A full postcode's inward code is always exactly
 * digit+letter+letter, so once whitespace is stripped that's the only
 * reliable way to find the boundary; anything shorter is already outward-only.
 */
export function postcodeOutward(value?: string | null): string {
  const normalized = normalizePostcode(value);
  const inward = normalized.slice(-3);
  if (normalized.length > 3 && /^[0-9][A-Z]{2}$/.test(inward)) {
    return normalized.slice(0, -3);
  }
  return normalized;
}

export function normalizeUrl(value?: string | null): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function normalizeReference(value?: string | null): string {
  if (!value) return "";
  return value.toUpperCase().replace(/[\s-]/g, "");
}

export function normalizeText(value?: string | null): string {
  if (!value) return "";
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function addressOverlap(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const tokensA = new Set(a.split(" ").filter((t) => t.length > 2));
  const tokensB = new Set(b.split(" ").filter((t) => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  const shared = [...tokensA].filter((t) => tokensB.has(t));
  const overlapRatio = shared.length / Math.min(tokensA.size, tokensB.size);
  return overlapRatio >= 0.7;
}

/**
 * Compares one candidate against one existing record and returns a score
 * (0-100+) plus the human-readable reasons that drove it. Higher is more
 * confident these are the same underlying home.
 */
export function scoreDuplicate(
  candidate: DuplicateCandidate,
  existing: DuplicateCandidate
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const candAddr = normalizeAddress(candidate.address);
  const exAddr = normalizeAddress(existing.address);
  if (candAddr && exAddr && candAddr === exAddr) {
    score += 45;
    reasons.push("Address matches exactly");
  } else if (addressOverlap(candAddr, exAddr)) {
    score += 25;
    reasons.push("Address substantially overlaps");
  }

  const candPostcode = normalizePostcode(candidate.postcode);
  const exPostcode = normalizePostcode(existing.postcode);
  if (candPostcode && exPostcode) {
    if (candPostcode === exPostcode) {
      score += 20;
      reasons.push("Postcode matches exactly");
    } else if (postcodeOutward(candidate.postcode) === postcodeOutward(existing.postcode)) {
      score += 5;
      reasons.push("Same postcode district");
    }
  }

  const candDev = normalizeText(candidate.development);
  const exDev = normalizeText(existing.development);
  if (candDev && exDev && candDev === exDev) {
    score += 20;
    reasons.push("Same development name");
  }

  const candRef = normalizeReference(candidate.reference);
  const exRef = normalizeReference(existing.reference);
  if (candRef && exRef && candRef === exRef) {
    score += 30;
    reasons.push("Same portal/agent reference number");
  }

  const candUrls = [candidate.listingUrl, ...(candidate.additionalUrls ?? [])]
    .filter(Boolean)
    .map((u) => normalizeUrl(u));
  const exUrls = [existing.listingUrl, ...(existing.additionalUrls ?? [])]
    .filter(Boolean)
    .map((u) => normalizeUrl(u));
  if (candUrls.some((u) => exUrls.includes(u))) {
    score += 35;
    reasons.push("Same listing URL");
  }

  const candAgent = normalizeText(candidate.agentName);
  const exAgent = normalizeText(existing.agentName);
  if (candAgent && exAgent && candAgent === exAgent) {
    score += 8;
    reasons.push("Same agent");
  }

  const candEmail = normalizeText(candidate.agentEmail);
  const exEmail = normalizeText(existing.agentEmail);
  if (candEmail && exEmail && candEmail === exEmail) {
    score += 8;
    reasons.push("Same agent email");
  }

  return { score, reasons };
}

/**
 * Scans a candidate against a list of existing records (properties, contact
 * log entries, or archived leads) and returns matches ranked by confidence.
 * Intended to run before a property is allowed to move to
 * "Ready to enquire".
 */
export function findDuplicateMatches(
  candidate: DuplicateCandidate,
  existing: DuplicateCandidate[]
): DuplicateMatch[] {
  return existing
    .filter((e) => e.id !== candidate.id)
    .map((e) => {
      const { score, reasons } = scoreDuplicate(candidate, e);
      return {
        candidateId: candidate.id,
        matchedId: e.id,
        confidence: (score >= 45 ? "strong" : "possible") as "strong" | "possible",
        score,
        reasons,
      };
    })
    .filter((m) => m.score >= 15)
    .sort((a, b) => b.score - a.score);
}
