import Link from "next/link";
import {
  Building2,
  Star,
  MailQuestion,
  MessagesSquare,
  BellRing,
  CalendarCheck2,
  XCircle,
  Sparkles,
  ArrowRight,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { getDashboardData } from "@/server/queries";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { PropertyCard } from "@/components/property/property-card";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateAssessment, shortName } from "@/lib/assessment";
import { notStatedOr } from "@/lib/status";
import { googleDirectionsUrl, SWALLOW_COURT } from "@/lib/maps";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const assessment = generateAssessment(data.properties);
  const now = new Date();

  return (
    <div>
      <PageHeader
        eyebrow={now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title="Where the search stands"
        description="One place for every property, enquiry, reply and viewing — refreshed from the CRM sheet."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/pipeline">
              Open pipeline <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-3 lg:px-8">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile icon={Building2} label="Active properties" value={data.active.length} href="/pipeline" />
            <StatTile icon={Star} label="Strong contenders" value={data.strongContenders.length} tone="terracotta" href="/pipeline?rankTier=STRONG_CONTENDER" />
            <StatTile icon={MailQuestion} label="Awaiting reply" value={data.awaitingReply.length} tone="amber" href="/pipeline?status=AWAITING_REPLY" />
            <StatTile icon={MessagesSquare} label="Active conversations" value={data.activeConversations.length} tone="sage" href="/pipeline?status=ACTIVE_CONVERSATION" />
            <StatTile icon={BellRing} label="Follow-ups due" value={data.followUpsDue.length} tone="amber" href="/pipeline?status=FOLLOW_UP_DUE" />
            <StatTile icon={CalendarCheck2} label="Confirmed viewings" value={data.confirmedViewings.length} tone="terracotta" href="/viewings" />
            <StatTile icon={XCircle} label="Unavailable / ruled out" value={data.closedOut.length} tone="clay" href="/pipeline?status=RULED_OUT" />
            <StatTile icon={Sparkles} label="New info (36h)" value={data.newInfoSince.length} tone="sage" />
          </div>

          {/* Estate-agent assessment */}
          <Card className="border-forest-800/15 bg-forest-900 text-ivory-soft">
            <CardContent className="p-5">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-sage-200/80">Estate-agent view</p>
              <p className="font-serif-display text-lg leading-relaxed italic">&ldquo;{assessment}&rdquo;</p>
            </CardContent>
          </Card>

          {/* Best options now */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif-display text-lg font-medium text-forest-900">Best options now</h2>
              <Link href="/pipeline" className="text-xs font-medium text-forest-700 hover:underline">
                View all
              </Link>
            </div>
            {data.bestOptionsNow.length === 0 ? (
              <EmptyState icon={Star} title="No ranked contenders yet" description="Set a tier on your strongest properties in the pipeline to see them here." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.bestOptionsNow.map((p, i) => (
                  <PropertyCard key={p.id} property={p} rankIndex={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Upcoming viewing */}
          <div>
            <h2 className="mb-3 font-serif-display text-lg font-medium text-forest-900">Upcoming viewings</h2>
            {data.confirmedViewings.length === 0 && data.upcomingViewings.length === 0 ? (
              <EmptyState icon={CalendarCheck2} title="No viewings booked" description="Confirmed viewings from the Marmie calendar will appear here." />
            ) : (
              <div className="flex flex-col gap-3">
                {data.upcomingViewings.slice(0, 4).map((v) => (
                  <Card key={v.id} className={v.status === "CONFIRMED" ? "border-terracotta-500/30" : ""}>
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-serif-display text-sm font-medium text-forest-900">
                            <Link href={`/properties/${v.property.id}`} className="hover:underline">
                              {shortName(v.property)}
                            </Link>
                          </p>
                          <p className="text-xs text-ink-500">{v.property.address}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            v.status === "CONFIRMED" ? "bg-terracotta-100 text-terracotta-700" : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {v.status === "CONFIRMED" ? "Confirmed" : "Proposed"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-ink-900">
                        {v.startAt
                          ? new Date(v.startAt).toLocaleString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Time to be confirmed"}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        {v.property.agent && <span className="text-ink-500">{v.property.agent.name}</span>}
                        <a
                          href={googleDirectionsUrl({
                            destinationLat: v.property.latitude,
                            destinationLng: v.property.longitude,
                            destinationAddress: v.property.address,
                            originLat: SWALLOW_COURT.lat,
                            originLng: SWALLOW_COURT.lng,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-forest-700 hover:underline"
                        >
                          <MapPin className="h-3 w-3" /> Directions from Swallow Court
                        </a>
                        {v.property.listingUrl && (
                          <a href={v.property.listingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-forest-700 hover:underline">
                            <ExternalLink className="h-3 w-3" /> Listing
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Immediate actions */}
          <div>
            <h2 className="mb-3 font-serif-display text-lg font-medium text-forest-900">Immediate actions</h2>
            {data.immediateActions.length === 0 ? (
              <EmptyState icon={BellRing} title="Nothing urgent" description="No next actions are set on active properties." />
            ) : (
              <Card>
                <CardContent className="divide-y divide-border-soft p-0">
                  {data.immediateActions.map(({ property }) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className="flex items-start justify-between gap-3 px-4 py-3 text-sm hover:bg-ivory-soft"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-forest-900">{shortName(property)}</p>
                        <p className="truncate text-xs text-ink-500">{notStatedOr(property.nextAction)}</p>
                      </div>
                      {property.nextActionDue && (
                        <span className="shrink-0 text-xs text-ink-500">
                          {new Date(property.nextActionDue).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pipeline chart */}
          <div>
            <h2 className="mb-3 font-serif-display text-lg font-medium text-forest-900">Pipeline at a glance</h2>
            <Card>
              <CardContent className="p-4">
                <PipelineChart counts={data.pipelineCounts} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
