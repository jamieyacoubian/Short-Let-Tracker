import { google } from "googleapis";
import { auth as getAuthSession } from "@/auth";

/**
 * Builds an authenticated googleapis OAuth2 client from the signed-in
 * user's session. Returns null when the user hasn't granted Google access
 * (e.g. they're using the local credentials sign-in, or haven't completed
 * the Google OAuth consent flow) — callers should treat that as
 * "integration not connected" and fall back gracefully, never throw.
 *
 * This function only ever runs server-side (route handlers, server
 * components, server actions) — the access token never reaches the browser.
 */
export async function getGoogleAuthClient() {
  const session = await getAuthSession();
  if (!session?.googleAccessToken) return null;

  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: session.googleAccessToken });
  return client;
}

export async function isGoogleConnected(): Promise<boolean> {
  const session = await getAuthSession();
  return !!session?.googleAccessToken;
}
