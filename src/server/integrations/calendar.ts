import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { getGoogleAuthClient } from "./google-auth";

/**
 * Google Calendar adapter — read-only. Looks for a calendar named "Marmie"
 * in the signed-in user's calendar list; falls back to the primary calendar
 * if none is found. Never creates, updates or deletes events — the app can
 * only ever propose a viewing locally and show it as PROPOSED until a
 * human confirms it directly in Google Calendar (a separate, explicit step
 * outside this app, matching the brief's "no calendar writes" requirement).
 */

export interface CalendarViewingEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  location: string | null;
  description: string | null;
  htmlLink: string | null;
}

const TARGET_CALENDAR_NAME = "Marmie";

async function resolveCalendarId(client: OAuth2Client): Promise<{ id: string; name: string }> {
  const calendar = google.calendar({ version: "v3", auth: client });
  const list = await calendar.calendarList.list();
  const marmie = list.data.items?.find((c) => c.summary?.toLowerCase() === TARGET_CALENDAR_NAME.toLowerCase());
  if (marmie?.id) return { id: marmie.id, name: marmie.summary ?? TARGET_CALENDAR_NAME };
  return { id: "primary", name: "Primary calendar (Marmie not found)" };
}

export async function listUpcomingViewings(
  client?: OAuth2Client | null
): Promise<{ connected: boolean; calendarName?: string; events: CalendarViewingEvent[]; error?: string }> {
  const authClient = client ?? (await getGoogleAuthClient());
  if (!authClient) return { connected: false, events: [] };

  try {
    const { id, name } = await resolveCalendarId(authClient);
    const calendar = google.calendar({ version: "v3", auth: authClient });
    const res = await calendar.events.list({
      calendarId: id,
      timeMin: new Date().toISOString(),
      maxResults: 25,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events: CalendarViewingEvent[] = (res.data.items ?? []).map((e) => ({
      id: e.id ?? "",
      title: e.summary ?? "Untitled event",
      start: e.start?.dateTime ?? e.start?.date ?? null,
      end: e.end?.dateTime ?? e.end?.date ?? null,
      location: e.location ?? null,
      description: e.description ?? null,
      htmlLink: e.htmlLink ?? null,
    }));

    return { connected: true, calendarName: name, events };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Calendar error";
    return { connected: true, events: [], error: message };
  }
}
