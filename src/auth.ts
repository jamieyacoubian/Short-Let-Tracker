import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * Minimum Google scopes needed for the read-only Gmail/Calendar adapters and
 * read/write Sheets sync. No Gmail *send* scope is requested — the app is
 * architecturally incapable of sending mail through this grant.
 */
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

const providers: NextAuthConfig["providers"] = [];

export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (googleConfigured) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
  );
}

export const localCredentialsConfigured = Boolean(process.env.ADMIN_PASSWORD);

if (localCredentialsConfigured) {
  providers.push(
    Credentials({
      id: "local",
      name: "Local access code",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Access code", type: "password" },
      },
      authorize: async (credentials) => {
        const username = (credentials?.username as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        const expectedUsername = process.env.ADMIN_USERNAME ?? "jamie";
        const expectedPassword = process.env.ADMIN_PASSWORD;
        if (!expectedPassword || !username || !password) return null;
        if (username !== expectedUsername || password !== expectedPassword) return null;
        return {
          id: "local-admin",
          name: "Jamie",
          email: process.env.ADMIN_EMAIL ?? "jamie@example.com",
        };
      },
    })
  );
}

const allowedGoogleEmails = (process.env.ALLOWED_GOOGLE_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email?.toLowerCase();
        if (allowedGoogleEmails.length === 0) return false;
        return !!email && allowedGoogleEmails.includes(email);
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleAccessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      // Only ever read via server-side `auth()` calls (route handlers, server
      // components, integration adapters) — this app never mounts a client
      // SessionProvider, so these values are never serialized to the browser.
      session.googleAccessToken = token.googleAccessToken as string | undefined;
      session.googleAccessTokenExpires = token.googleAccessTokenExpires as number | undefined;
      return session;
    },
  },
});
