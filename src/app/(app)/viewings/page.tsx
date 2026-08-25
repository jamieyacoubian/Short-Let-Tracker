import Link from "next/link";
import { CalendarClock, ListChecks, Map as MapIcon, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getViewings } from "@/server/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarMonth } from "@/components/viewings/calendar-month";
import { shortName } from "@/lib/assessment";
import { googleDirectionsUrl, SWALLOW_COURT } from "@/lib/maps";

export const dynamic = "force-dynamic";

export default async function ViewingsPage() {
  const viewings = await getViewings();

  return (
    <div>
      <PageHeader
        eyebrow={`${viewings.length} viewings tracked`}
        title="Viewings"
        description="Confirmed viewings are read from the Marmie calendar; proposed times stay proposed until an exact slot is agreed."
      />

      <div className="px-4 lg:px-8">
        {viewings.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No viewings yet" description="Add a viewing from a property's page to see it here." />
        ) : (
          <Tabs defaultValue="agenda">
            <TabsList>
              <TabsTrigger value="agenda" className="gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Agenda
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> Calendar
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1.5">
                <MapIcon className="h-3.5 w-3.5" /> Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agenda" className="flex flex-col gap-3">
              {viewings.map((v) => (
                <Card key={v.id}>
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-serif-display text-base font-medium text-forest-900">
                          <Link href={`/properties/${v.propertyId}`} className="hover:underline">
                            {shortName(v.property)}
                          </Link>
                        </p>
                        <Badge variant={v.status === "CONFIRMED" ? "terracotta" : v.status === "COMPLETED" ? "sage" : "amber"}>{v.status.toLowerCase()}</Badge>
                      </div>
                      <p className="text-xs text-ink-500">{v.property.address}</p>
                      <p className="mt-1 text-sm font-medium text-ink-900">
                        {v.startAt
                          ? new Date(v.startAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
                          : "Time to be confirmed"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {v.property.agent && (
                        <span className="text-ink-500">
                          {v.property.agent.name}
                          {v.property.agent.phone ? ` · ${v.property.agent.phone}` : ""}
                        </span>
                      )}
                      {v.property.listingUrl && (
                        <a href={v.property.listingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-forest-700 hover:underline">
                          <ExternalLink className="h-3 w-3" /> Listing
                        </a>
                      )}
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
                        className="text-forest-700 hover:underline"
                      >
                        Directions from Swallow Court
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarMonth viewings={viewings} monthDate={viewings.find((v) => v.startAt)?.startAt ?? new Date()} />
            </TabsContent>

            <TabsContent value="map" className="flex flex-col gap-3">
              {viewings.map((v) => (
                <Card key={v.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-forest-900">{shortName(v.property)}</p>
                      <p className="text-xs text-ink-500">{v.property.address}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.property.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ivory-soft"
                    >
                      <MapIcon className="h-3.5 w-3.5" /> View on map
                    </a>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
