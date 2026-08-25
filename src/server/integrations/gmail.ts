import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { getGoogleAuthClient } from "./google-auth";
import { normalizeAddress, normalizePostcode, normalizeReference, normalizeUrl } from "@/lib/duplicates";

/**
 * Gmail adapter — strictly read-only. The OAuth scope requested
 * (gmail.readonly, see src/auth.ts) makes it structurally impossible for
 * this app to send, modify or delete mail; there is no send/modify code
 * path anywhere in this module or the rest of the app.
 *
 * Threads are matched to a property using the same signals as duplicate
 * detection (address, postcode, listing URL, portal reference, agent name/
 * email) rather than a hard property ID, since Gmail has no concept of one.
 */

export interface GmailMatchInput {
  address?: string | null;
  postcode?: string | null;
  listingUrl?: string | null;
  reference?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
}

export interface GmailMatchedMessage {
  threadId: string;
  messageId: string;
  subject: string;
  snippet: string;
  from: string;
  to: string;
  date: string;
  isSent: boolean;
  webUrl: string;
}

export function isGmailScopeGranted(session: { googleAccessToken?: string } | null): boolean {
  return !!session?.googleAccessToken;
}

function buildQuery(input: GmailMatchInput): string {
  const terms: string[] = [];
  if (input.reference) terms.push(`"${input.reference}"`);
  if (input.postcode) terms.push(`"${normalizePostcode(input.postcode)}"`);
  if (input.agentEmail) terms.push(`from:${input.agentEmail} OR to:${input.agentEmail}`);
  if (input.address) {
    const firstSegment = input.address.split(",")[0];
    if (firstSegment) terms.push(`"${firstSegment.trim()}"`);
  }
  // Search Inbox + Sent + All Mail, last 90 days, matching any of the above signals.
  const subject = terms.length ? `(${terms.join(" OR ")})` : "";
  return `${subject} newer_than:90d`.trim();
}

/**
 * Searches Inbox/Sent for messages that plausibly relate to a property,
 * using the same matching signals as duplicate-checking. Returns an empty,
 * clearly-labelled result (never throws) when Gmail access isn't granted.
 */
export async function findMatchingThreads(
  input: GmailMatchInput,
  client?: OAuth2Client | null
): Promise<{ connected: boolean; messages: GmailMatchedMessage[]; error?: string }> {
  const authClient = client ?? (await getGoogleAuthClient());
  if (!authClient) {
    return { connected: false, messages: [] };
  }

  try {
    const gmail = google.gmail({ version: "v1", auth: authClient });
    const query = buildQuery(input);
    if (!query) return { connected: true, messages: [] };

    const list = await gmail.users.messages.list({ userId: "me", q: query, maxResults: 15 });
    const messages: GmailMatchedMessage[] = [];

    for (const m of list.data.messages ?? []) {
      if (!m.id) continue;
      const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "metadata", metadataHeaders: ["Subject", "From", "To", "Date"] });
      const headers = full.data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
      const labelIds = full.data.labelIds ?? [];

      messages.push({
        threadId: full.data.threadId ?? "",
        messageId: m.id,
        subject: get("Subject"),
        snippet: full.data.snippet ?? "",
        from: get("From"),
        to: get("To"),
        date: get("Date"),
        isSent: labelIds.includes("SENT"),
        webUrl: `https://mail.google.com/mail/u/0/#all/${full.data.threadId}`,
      });
    }

    return { connected: true, messages };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Gmail error";
    return { connected: true, messages: [], error: message };
  }
}

/** Re-exported so callers can build match inputs with the same normalization used across the app. */
export { normalizeAddress, normalizeUrl, normalizeReference };
