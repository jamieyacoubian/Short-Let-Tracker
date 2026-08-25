import { CheckCircle2, XCircle, Table2, Mail, CalendarClock, MapPinned, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { googleConfigured, localCredentialsConfigured, auth } from "@/auth";
import { isSheetsConfigured } from "@/server/integrations/sheets";
import { getMapProvider } from "@/lib/maps";
import { getSources, getRecentAuditLog } from "@/server/queries";
import { SyncButton } from "@/components/settings/sync-button";

export const dynamic = "force-dynamic";

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border-soft py-3 last:border-0">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-700" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />}
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        <p className="text-xs text-ink-500">{detail}</p>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  const sources = await getSources();
  const auditLog = await getRecentAuditLog(15);
  const googleConnected = !!session?.googleAccessToken;
  const mapProvider = getMapProvider();

  return (
    <div>
      <PageHeader title="Settings &amp; integrations" description="Connection status for every external data source, and read-only reference lists." />

      <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-2 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-4 w-4" /> Google Sheets
            </CardTitle>
            <CardDescription>Jamie &amp; Margaret — London Rental CRM (source of truth)</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusRow ok={isSheetsConfigured()} label="Spreadsheet ID configured" detail={isSheetsConfigured() ? "CRM_SPREADSHEET_ID is set." : "Set CRM_SPREADSHEET_ID in .env to enable sync."} />
            <StatusRow ok={googleConnected} label="Google session" detail={googleConnected ? "Signed in with Google — read/write access available." : "Sign in with Google to enable live sync."} />
            <div className="pt-3">
              <SyncButton disabled={!isSheetsConfigured() || !googleConnected} />
              <p className="mt-2 text-xs text-ink-500">
                Data currently shown was imported from a snapshot of the sheet. Re-syncing updates properties matched by their sheet
                &quot;Property ID&quot; — existing formulas, formatting and validation elsewhere in the sheet are never touched.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Gmail (read-only)
            </CardTitle>
            <CardDescription>Matches Inbox &amp; Sent threads to properties. Cannot send mail.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusRow ok={googleConfigured} label="OAuth client configured" detail={googleConfigured ? "GOOGLE_CLIENT_ID/SECRET are set." : "Set GOOGLE_CLIENT_ID/SECRET in .env."} />
            <StatusRow ok={googleConnected} label="Session grants gmail.readonly" detail={googleConnected ? "Connected." : "Sign in with Google to enable."} />
            <p className="pt-2 text-xs text-ink-500">
              Only the <code className="rounded bg-ivory-soft px-1">gmail.readonly</code> scope is requested — there is no send or modify
              code path anywhere in this app.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> Google Calendar
            </CardTitle>
            <CardDescription>Reads the shared &quot;Marmie&quot; calendar; falls back to primary.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusRow ok={googleConfigured} label="OAuth client configured" detail={googleConfigured ? "GOOGLE_CLIENT_ID/SECRET are set." : "Set GOOGLE_CLIENT_ID/SECRET in .env."} />
            <StatusRow ok={googleConnected} label="Session grants calendar.readonly" detail={googleConnected ? "Connected." : "Sign in with Google to enable."} />
            <p className="pt-2 text-xs text-ink-500">Read-only — this app never creates, edits or deletes calendar events.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="h-4 w-4" /> Map provider
            </CardTitle>
            <CardDescription>Google Maps or Mapbox, chosen via NEXT_PUBLIC_MAP_PROVIDER.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusRow
              ok={mapProvider !== "none"}
              label={`Active provider: ${mapProvider === "none" ? "none" : mapProvider}`}
              detail={mapProvider === "none" ? "Set NEXT_PUBLIC_MAPBOX_TOKEN or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Keyless map embeds and Maps links still work without one." : "Configured."}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Property images
            </CardTitle>
            <CardDescription>Only images verifiably linked to the exact listing are ever shown.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-ink-500">
              No automated image source is configured — attach photos manually per property with their source listing URL, and the app
              verifies the pairing before marking an image &quot;Verified&quot;. Unverified images always show a clear placeholder instead
              of a possibly-wrong photo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign-in methods</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusRow ok={googleConfigured} label="Google OAuth" detail={googleConfigured ? "Available." : "Not configured."} />
            <StatusRow ok={localCredentialsConfigured} label="Local access code" detail={localCredentialsConfigured ? "Available." : "Set ADMIN_PASSWORD to enable."} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agents &amp; sources watchlist</CardTitle>
            <CardDescription>{sources.length} portals and agencies tracked, mirrored from the CRM sheet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-ink-500">
                    <th className="py-2 pr-4 font-medium">Source</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Short-let strength</th>
                    <th className="py-2 pr-4 font-medium">Watchlist</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.id} className="border-b border-border-soft last:border-0">
                      <td className="py-2 pr-4">
                        {s.searchUrl ? (
                          <a href={s.searchUrl} target="_blank" rel="noreferrer" className="text-forest-700 hover:underline">
                            {s.name}
                          </a>
                        ) : (
                          s.name
                        )}
                      </td>
                      <td className="py-2 pr-4 text-ink-500">{s.type ?? "—"}</td>
                      <td className="py-2 pr-4 text-ink-500">{s.shortLetStrength ?? "—"}</td>
                      <td className="py-2 pr-4">{s.onBriefingWatchlist ? <Badge variant="sage">Yes</Badge> : <Badge variant="ink">No</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent sync &amp; audit log</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {auditLog.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b border-border-soft py-1.5 text-xs last:border-0">
                <span className="text-ink-700">{a.summary}</span>
                <span className="shrink-0 text-ink-300">{new Date(a.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
