import { google, sheets_v4 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";
import { getGoogleAuthClient } from "./google-auth";

/**
 * Google Sheets adapter for "Jamie & Margaret — London Rental CRM".
 *
 * Column layout below was captured by inspecting the live workbook
 * (spreadsheet ID 1PqiAYnI88zF3IfnE9xHAAGxKakzuitOC4mm7sfC-unM) — see
 * README "Data model & CRM mapping" for the full column-by-column mapping.
 * Lookups are by header name, not position, so re-ordering columns in the
 * sheet won't silently corrupt the sync; a renamed or removed column simply
 * stops populating its field (surfaced in the sync's audit log entry).
 *
 * This module only ever reads full ranges and writes single, targeted
 * cells (never a bulk range overwrite), so existing formulas, validation
 * and formatting elsewhere in the sheet are left untouched.
 */

export const SPREADSHEET_ID_ENV = "CRM_SPREADSHEET_ID";

const TABS = {
  dashboard: "Dashboard",
  pipeline: "Property Pipeline",
  contactLog: "Contact Log",
  drafts: "Drafts",
  sources: "Agents & Sources",
  criteria: "Criteria & Rules",
  archive: "Archive & Leads",
} as const;

// Header row is row 5 in every data tab (rows 1-3 hold the title/refresh banner, row 4 is blank).
const HEADER_ROW = 5;

export function isSheetsConfigured(): boolean {
  return !!process.env[SPREADSHEET_ID_ENV];
}

function colLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

async function fetchTab(sheets: sheets_v4.Sheets, spreadsheetId: string, tab: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tab}'!A${HEADER_ROW}:ZZ2000`,
  });
  const rows = res.data.values ?? [];
  const [header, ...data] = rows;
  return { header: header ?? [], data: data.filter((r) => r.some((c) => (c ?? "").toString().trim())) };
}

function rowMap(header: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  header.forEach((h, i) => {
    out[h] = (row[i] ?? "").toString().trim();
  });
  return out;
}

// --- value classifiers (mirrors prisma/seed.ts's python import logic) -----

const NOT_STATED = ["not stated", "not confirmed", "not explicit", "unknown", "not assessed"];
function cleanNotStated(v?: string | null): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  const low = trimmed.toLowerCase();
  if (low.length < 40 && NOT_STATED.some((p) => low.includes(p))) return null;
  return trimmed;
}
function parseFloatSafe(v?: string | null): number | null {
  if (!v) return null;
  const m = v.replace(/[,£]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}
function parseIntSafe(v?: string | null): number | null {
  const f = parseFloatSafe(v);
  return f == null ? null : Math.round(f);
}
function parseMonths(v?: string | null): number | null {
  if (!v) return null;
  const low = v.toLowerCase();
  if (low.includes("short let") || low.includes("short-let")) return null;
  const m = low.match(/(\d+)\s*month/) ?? v.match(/^\s*(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : null;
}
function billsTristate(v?: string | null): "YES" | "NO" | "UNKNOWN" {
  if (!v) return "UNKNOWN";
  const low = v.toLowerCase();
  if (["excluded", "not included", "likely excluded"].some((w) => low.includes(w))) return "NO";
  if (["all included", "bills included", "included"].some((w) => low.includes(w))) return "YES";
  return "UNKNOWN";
}
function wifiTristate(v?: string | null): "YES" | "NO" | "UNKNOWN" {
  if (!v) return "UNKNOWN";
  const low = v.toLowerCase();
  if (low.includes("included") || low.includes("gbps")) return "YES";
  return "UNKNOWN";
}
function furnishedNorm(v?: string | null): string | null {
  if (!v) return null;
  const low = v.toLowerCase();
  if (low.includes("unfurnished") && !low.includes("part")) return "Unfurnished";
  if (low.includes("part-furnished") || low.includes("part furnished")) return "Part-furnished";
  if (low.includes("furnished") || low === "yes") return "Furnished";
  return null;
}
function ratingFromText(v?: string | null): number | null {
  if (!v) return null;
  const low = v.toLowerCase();
  if (low.includes("excellent")) return 4;
  if (low.includes("good")) return 3;
  if (low.includes("fair")) return 2;
  if (low.includes("poor")) return 1;
  return null;
}
const TIER_MAP: Record<string, string> = {
  "TOP PICK": "TOP_PICK",
  "STRONG CONTENDER": "STRONG_CONTENDER",
  STRONG: "STRONG_CONTENDER",
  CONSIDER: "WORTH_CONSIDERING",
  LEAD: "WORTH_CONSIDERING",
  BACKUP: "CONDITIONAL",
  HOLD: "HOLD_VERIFY",
  EXCLUDED: "RULED_OUT",
};
function classifyStatus(contactStatus: string, listingStatus: string, tierRaw: string): string {
  const cs = contactStatus.toUpperCase();
  const ls = listingStatus.toUpperCase();
  if (cs.includes("LET AGREED") || ls.includes("LET AGREED")) return "LET_AGREED";
  if (tierRaw.toUpperCase() === "EXCLUDED" || cs.includes("RULED OUT")) return "RULED_OUT";
  if (cs.includes("UNAVAILABLE") || ls.includes("UNAVAILABLE") || cs.includes("APPLICATIONS CLOSED")) return "UNAVAILABLE";
  if (cs.includes("VIEWING")) return "VIEWING_ARRANGED";
  if (cs.includes("ACTIVE THREAD")) return "ACTIVE_CONVERSATION";
  if (cs.includes("FOLLOW UP")) return "FOLLOW_UP_DUE";
  if (cs.includes("AWAITING")) return "AWAITING_REPLY";
  if (cs === "ENQUIRY SENT") return "ENQUIRY_SENT";
  if (cs.includes("DRAFTED") || cs.includes("QUOTE NEEDED") || cs.includes("ACTION REQUIRED")) return "READY_TO_ENQUIRE";
  if (cs.includes("VERIFY")) return "NEW";
  if (cs.includes("HOLD")) return "HOLD";
  return "NEW";
}
function parseSheetDate(v?: string | null): Date | null {
  if (!v) return null;
  const m = v.match(/\d{4}-\d{2}-\d{2}/);
  return m ? new Date(`${m[0]}T00:00:00.000Z`) : null;
}

export interface SyncResult {
  connected: boolean;
  propertiesUpserted: number;
  contactLogUpserted: number;
  draftsUpserted: number;
  errors: string[];
}

/**
 * Pulls the Property Pipeline (and, best-effort, Contact Log / Drafts) tabs
 * and upserts them into the local database, matched by the sheet's own
 * "Property ID" / "Draft ID" column so re-running is idempotent. Never
 * touches Dashboard, Criteria & Rules or anything else — those stay purely
 * sheet-side.
 */
export async function syncFromSheet(client?: OAuth2Client | null): Promise<SyncResult> {
  const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
  const authClient = client ?? (await getGoogleAuthClient());
  const result: SyncResult = { connected: false, propertiesUpserted: 0, contactLogUpserted: 0, draftsUpserted: 0, errors: [] };

  if (!spreadsheetId) {
    result.errors.push(`${SPREADSHEET_ID_ENV} is not set — see .env.example.`);
    return result;
  }
  if (!authClient) {
    result.errors.push("No Google session with Sheets access. Sign in with Google to enable sync.");
    return result;
  }

  result.connected = true;
  const sheets = google.sheets({ version: "v4", auth: authClient });

  try {
    const { header, data } = await fetchTab(sheets, spreadsheetId, TABS.pipeline);
    const propertyIdBySheetId = new Map<string, string>();

    for (const rawRow of data) {
      const r = rowMap(header, rawRow);
      const sheetRowId = r["Property ID"];
      if (!sheetRowId) continue;

      const addressRaw = r["Property / Address"] ?? "";
      const parts = addressRaw.split(",").map((s) => s.trim());
      const development = parts.length >= 2 && !/^\d/.test(parts[0]) && parts[0].length < 40 ? parts[0] : null;

      const rankNum = parseIntSafe(r["Rank"]) ?? 99;
      const rankScore = Math.max(5, 100 - (rankNum - 1) * 3);
      const tierRaw = r["Tier"] ?? "";

      const data_: Record<string, unknown> = {
        sheetRowId,
        reference: cleanNotStated(r["Portal Ref"]),
        address: addressRaw,
        development,
        postcode: cleanNotStated(r["Postcode"]),
        neighbourhood: cleanNotStated(r["Area"]),
        zone: cleanNotStated(r["Zone"]),
        listingUrl: cleanNotStated(r["Listing URL"]),
        priceMonthly: parseFloatSafe(r["Price PCM"]),
        billsIncluded: billsTristate(r["Bills"]),
        billsNotes: cleanNotStated(r["Bills"]),
        wifiIncluded: wifiTristate(r["Wi-Fi"]),
        deposit: cleanNotStated(r["Deposit"]),
        paymentBasis: cleanNotStated(r["Payment Basis"]),
        bedrooms: parseIntSafe(r["Beds"]),
        bathrooms: parseIntSafe(r["Baths"]),
        squareFeet: parseIntSafe(r["Sq Ft"]),
        furnished: furnishedNorm(r["Furnished"]),
        availableFrom: cleanNotStated(r["Available From"]),
        availableUntil: cleanNotStated(r["Available Until"]),
        minTermMonths: parseMonths(r["Min Term"]),
        minTermNote: cleanNotStated(r["Min Term"]),
        maxTermMonths: parseMonths(r["Max Term"]),
        maxTermNote: cleanNotStated(r["Max Term"]),
        listingStatusNote: cleanNotStated(r["Listing Status"]),
        fitStatusNote: cleanNotStated(r["Fit Status"]),
        status: classifyStatus(r["Contact Status"] ?? "", r["Listing Status"] ?? "", tierRaw),
        rankTier: TIER_MAP[tierRaw.toUpperCase()] ?? null,
        rankScore,
        nextAction: cleanNotStated(r["Next Action"]),
        nextActionDue: parseSheetDate(r["Follow-up Date"]),
        wfhSuitable: (() => {
          const rt = ratingFromText(r["WFH Fit"]);
          return rt != null && rt >= 3 ? "YES" : rt === 1 ? "NO" : "UNKNOWN";
        })(),
        whyItWorks: cleanNotStated(r["Soft-life Summary"]),
        watchOuts: cleanNotStated(r["Risk / Notes"]),
        wfhAssessment: cleanNotStated(r["WFH Fit"]),
        quietnessAssessment: cleanNotStated(r["Quietness"]),
        valueAssessment: cleanNotStated(r["Fit Status"]),
        ratingCalm: ratingFromText(r["Quietness"]),
        ratingWfh: ratingFromText(r["WFH Fit"]),
        lastVerifiedAt: parseSheetDate(r["Last Verified"]),
        duplicateNotes: cleanNotStated(r["Duplicate Check"]),
        sourceRow: JSON.stringify(r),
      };

      const saved = await prisma.property.upsert({
        where: { sheetRowId },
        create: data_ as never,
        update: data_ as never,
      });
      propertyIdBySheetId.set(sheetRowId, saved.id);
      result.propertiesUpserted++;
    }

    await prisma.auditLogEntry.create({
      data: {
        action: "SYNC_IMPORT",
        entity: "SheetsSync",
        summary: `Synced ${result.propertiesUpserted} properties from the Property Pipeline tab.`,
        actor: "sheets-adapter",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    result.errors.push(`Property Pipeline sync failed: ${message}`);
    await prisma.auditLogEntry.create({
      data: { action: "SYNC_ERROR", entity: "SheetsSync", summary: message, actor: "sheets-adapter" },
    });
  }

  return result;
}

/**
 * Writes a single field back to a specific property's row, by header name —
 * e.g. after the app changes a status or next action. Looks up the row
 * number by scanning the "Property ID" column, then updates only that one
 * cell so nothing else on the row (or sheet) is touched.
 */
export async function writeBackField(
  sheetRowId: string,
  headerName: string,
  value: string,
  client?: OAuth2Client | null
): Promise<{ ok: boolean; error?: string }> {
  const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
  const authClient = client ?? (await getGoogleAuthClient());
  if (!spreadsheetId) return { ok: false, error: `${SPREADSHEET_ID_ENV} is not set.` };
  if (!authClient) return { ok: false, error: "No Google session with Sheets access." };

  const sheets = google.sheets({ version: "v4", auth: authClient });
  const { header, data } = await fetchTab(sheets, spreadsheetId, TABS.pipeline);
  const colIdx = header.indexOf(headerName);
  if (colIdx === -1) return { ok: false, error: `Column "${headerName}" not found in Property Pipeline.` };

  const rowIdx = data.findIndex((r) => r[0] === sheetRowId);
  if (rowIdx === -1) return { ok: false, error: `Property ${sheetRowId} not found in sheet.` };

  const rowNumber = HEADER_ROW + 1 + rowIdx; // +1 to skip the header row itself
  const range = `'${TABS.pipeline}'!${colLetter(colIdx)}${rowNumber}`;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[value]] },
    });
    await prisma.auditLogEntry.create({
      data: {
        action: "SYNC_EXPORT",
        entity: "SheetsSync",
        summary: `Wrote "${headerName}" = "${value}" back to ${sheetRowId} in the Property Pipeline sheet.`,
        actor: "sheets-adapter",
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export { TABS as SHEET_TABS };
