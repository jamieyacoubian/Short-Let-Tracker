import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Phone, Mail, ShieldAlert, FileQuestion, CalendarClock } from "lucide-react";
import { getPropertyDetail, getAllProperties } from "@/server/queries";
import { StatusRankEditor } from "@/components/property/status-rank-editor";
import { Gallery } from "@/components/property/gallery";
import { FactRow } from "@/components/property/fact-row";
import { RatingsGrid } from "@/components/property/ratings-grid";
import { MapCard } from "@/components/property/map-card";
import { Timeline } from "@/components/property/timeline";
import { CopyDraftButton } from "@/components/property/copy-draft-button";
import { AddContactLogForm } from "@/components/property/add-contact-log-form";
import { AddViewingForm } from "@/components/property/add-viewing-form";
import { RecordViewingNoteForm } from "@/components/property/record-viewing-note-form";
import { DuplicateCheckButton } from "@/components/property/duplicate-check-button";
import { SourceRowViewer } from "@/components/property/source-row-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatGBP, resolvePriceFigures, priceConflict } from "@/lib/pricing";
import { notStatedOr, tristateLabel, isStaleListing, CLOSED_STATUSES } from "@/lib/status";
import { shortName } from "@/lib/assessment";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

const TRANSPORT_MODE_LABEL: Record<string, string> = {
  WALK: "Walk",
  TUBE: "Tube",
  OVERGROUND: "Overground",
  DLR: "DLR",
  NATIONAL_RAIL: "National Rail",
  BUS: "Bus",
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyDetail(id);
  if (!property) notFound();

  const allProperties = await getAllProperties();
  const nearby = allProperties
    .filter((p) => p.id !== property.id && p.neighbourhood && p.neighbourhood === property.neighbourhood)
    .slice(0, 5);

  const prices = resolvePriceFigures({ priceMonthly: property.priceMonthly, priceWeekly: property.priceWeekly });
  const conflict = priceConflict({ priceMonthly: property.priceMonthly, priceWeekly: property.priceWeekly });

  return (
    <div className="px-4 pb-16 pt-4 lg:px-8">
      <Link href="/pipeline" className="mb-4 flex w-fit items-center gap-1.5 text-sm text-ink-500 hover:text-forest-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to pipeline
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-terracotta-600">
            {[property.neighbourhood, property.postcode].filter(Boolean).join(" · ") || "Area not stated"}
          </p>
          <h1 className="font-serif-display text-2xl font-medium text-forest-900 sm:text-3xl">{shortName(property)}</h1>
          <p className="mt-1 text-sm text-ink-500">{property.address}</p>
        </div>
        <StatusRankEditor propertyId={property.id} status={property.status} rankTier={property.rankTier} />
      </div>

      {property.duplicateNotes && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-600/30 bg-amber-100 px-3 py-2 text-sm text-amber-600">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{property.duplicateNotes}</span>
        </div>
      )}

      {!CLOSED_STATUSES.includes(property.status) && isStaleListing(property) && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-600/30 bg-amber-100 px-3 py-2 text-sm text-amber-600">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {property.lastVerifiedAt
              ? `Not re-verified since ${new Date(property.lastVerifiedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} — worth a quick re-check before relying on these facts.`
              : "Never verified — confirm these facts with the agent before relying on them."}
          </span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <Gallery images={property.images} />
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transport">Transport &amp; map</TabsTrigger>
              <TabsTrigger value="contact">Contact history</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="viewings">Viewings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Facts</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl>
                    <FactRow
                      label="Price"
                      value={
                        prices.monthly
                          ? `${formatGBP(prices.monthly)} pcm ${prices.weekly ? `(≈ ${formatGBP(prices.weekly)}/wk)` : ""}`
                          : notStatedOr(null)
                      }
                      muted={!prices.monthly}
                    />
                    {conflict && (
                      <FactRow label="⚠ Price conflict" value="Monthly and weekly figures don't reconcile — confirm with agent" />
                    )}
                    <FactRow label="Bills" value={notStatedOr(property.billsNotes) === property.billsNotes ? (property.billsNotes ?? tristateLabel(property.billsIncluded)) : tristateLabel(property.billsIncluded)} muted={!property.billsNotes} />
                    <FactRow label="Council tax" value={notStatedOr(property.councilTaxNotes)} muted={!property.councilTaxNotes} />
                    <FactRow label="Wi-Fi" value={tristateLabel(property.wifiIncluded)} />
                    <FactRow label="Bedrooms / bathrooms" value={`${property.bedrooms ?? "—"} bed / ${property.bathrooms ?? "—"} bath`} />
                    <FactRow label="Square footage" value={property.squareFeet ? `${property.squareFeet} sq ft` : notStatedOr(null)} muted={!property.squareFeet} />
                    <FactRow label="Furnished" value={notStatedOr(property.furnished)} muted={!property.furnished} />
                    <FactRow label="Availability" value={notStatedOr(property.availableFrom)} muted={!property.availableFrom} />
                    <FactRow
                      label="Term"
                      value={notStatedOr(
                        [property.minTermNote ?? (property.minTermMonths ? `${property.minTermMonths} mo min` : null), property.maxTermNote ?? (property.maxTermMonths ? `${property.maxTermMonths} mo max` : null)]
                          .filter(Boolean)
                          .join(" – ") || null
                      )}
                    />
                    <FactRow label="Payment basis" value={notStatedOr(property.paymentBasis)} muted={!property.paymentBasis} />
                    <FactRow label="Deposit" value={notStatedOr(property.deposit)} muted={!property.deposit} />
                    <FactRow label="Floor / lift" value={notStatedOr([property.floor, tristateLabel(property.hasLift) === "Unknown" ? null : `Lift: ${tristateLabel(property.hasLift)}`].filter(Boolean).join(" · ") || null)} />
                    <FactRow label="Parking" value={notStatedOr(property.parking)} muted={!property.parking} />
                    <FactRow label="Outdoor space" value={notStatedOr(property.outdoorSpace)} muted={!property.outdoorSpace} />
                    <FactRow label="Broadband" value={notStatedOr(property.broadband)} muted={!property.broadband} />
                    <FactRow
                      label="Agent"
                      value={
                        property.agent ? (
                          <span className="flex flex-col items-end gap-0.5">
                            <span>{property.agent.name}{property.agent.branch ? ` · ${property.agent.branch}` : ""}</span>
                            <span className="flex gap-2 text-xs">
                              {property.agent.email && (
                                <a href={`mailto:${property.agent.email}`} className="flex items-center gap-1 text-forest-700 hover:underline">
                                  <Mail className="h-3 w-3" /> {property.agent.email}
                                </a>
                              )}
                              {property.agent.phone && (
                                <a href={`tel:${property.agent.phone}`} className="flex items-center gap-1 text-forest-700 hover:underline">
                                  <Phone className="h-3 w-3" /> {property.agent.phone}
                                </a>
                              )}
                            </span>
                          </span>
                        ) : (
                          notStatedOr(null)
                        )
                      }
                    />
                    <FactRow
                      label="Listing"
                      value={
                        property.listingUrl ? (
                          <a href={property.listingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-forest-700 hover:underline">
                            View listing <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          notStatedOr(null)
                        )
                      }
                    />
                    {property.reference && <FactRow label="Portal reference" value={property.reference} />}
                    <FactRow
                      label="Last verified"
                      value={property.lastVerifiedAt ? new Date(property.lastVerifiedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : notStatedOr(null)}
                      muted={!property.lastVerifiedAt}
                    />
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evaluation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <RatingsGrid property={property} />
                  <dl>
                    <FactRow label="Why it works" value={notStatedOr(property.whyItWorks)} muted={!property.whyItWorks} />
                    <FactRow label="Watch-outs" value={notStatedOr(property.watchOuts)} muted={!property.watchOuts} />
                    <FactRow label="WFH assessment" value={notStatedOr(property.wfhAssessment)} muted={!property.wfhAssessment} />
                    <FactRow label="Layout / fit" value={notStatedOr(property.fitStatusNote)} muted={!property.fitStatusNote} />
                    <FactRow label="Quietness" value={notStatedOr(property.quietnessAssessment)} muted={!property.quietnessAssessment} />
                    <FactRow label="Value assessment" value={notStatedOr(property.valueAssessment)} muted={!property.valueAssessment} />
                    <FactRow label="Verdict" value={notStatedOr(property.verdict)} muted={!property.verdict} />
                  </dl>
                </CardContent>
              </Card>

              <SourceRowViewer sourceRow={property.sourceRow} label="Property Pipeline" />
            </TabsContent>

            <TabsContent value="transport" className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transport links</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.transportLinks.length === 0 ? (
                    <p className="text-sm text-ink-500">No transport estimates recorded yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {property.transportLinks.map((t) => (
                        <li key={t.id} className="flex items-center justify-between border-b border-border-soft py-1.5 text-sm last:border-0">
                          <span className="text-ink-900">{t.destination}</span>
                          <span className="flex items-center gap-2 text-ink-500">
                            <Badge variant="ink">{TRANSPORT_MODE_LABEL[t.mode]}</Badge>
                            {t.minMinutes}–{t.maxMinutes} min
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapCard property={property} nearby={nearby} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="flex flex-col gap-4">
              <div className="flex justify-end">
                <AddContactLogForm propertyId={property.id} />
              </div>
              <Card>
                <CardContent className="pt-5">
                  <Timeline entries={property.contactLogs} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drafts" className="flex flex-col gap-4">
              {property.drafts.length === 0 ? (
                <EmptyState icon={FileQuestion} title="No drafts prepared" description="Prepared enquiry or reply text will appear here — nothing is ever sent from this app." />
              ) : (
                property.drafts.map((d) => (
                  <Card key={d.id}>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base">{d.subject ?? `${d.channel === "EMAIL" ? "Email" : "Portal form"} draft`}</CardTitle>
                        <p className="text-xs text-ink-500">{d.body.length} characters · prepared {new Date(d.preparedAt).toLocaleDateString("en-GB")}</p>
                      </div>
                      <Badge variant={d.status === "READY_NOT_SENT" ? "sage" : d.status === "SENT" ? "ink" : "amber"}>
                        {d.status.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <pre className="whitespace-pre-wrap rounded-md bg-ivory-soft p-3 text-xs text-ink-700">{d.body}</pre>
                      {d.questionsCovered && <p className="text-xs text-ink-500">Covers: {d.questionsCovered}</p>}
                      <div>
                        <CopyDraftButton text={d.body} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="viewings" className="flex flex-col gap-4">
              <div className="flex justify-end">
                <AddViewingForm propertyId={property.id} />
              </div>
              {property.viewings.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No viewings yet" description="Proposed and confirmed viewings will appear here." />
              ) : (
                property.viewings.map((v) => (
                  <Card key={v.id}>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">
                        {v.startAt
                          ? new Date(v.startAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
                          : "Time to be confirmed"}
                      </CardTitle>
                      <Badge variant={v.status === "CONFIRMED" ? "terracotta" : v.status === "COMPLETED" ? "sage" : "amber"}>{v.status.toLowerCase()}</Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {v.questionsToAsk && <p className="text-sm text-ink-700">Questions: {v.questionsToAsk}</p>}
                      {v.notesAfter && <p className="text-sm text-ink-700">Notes: {v.notesAfter}</p>}
                      <div className="flex items-center justify-between">
                        <Badge variant="ink">{v.decision.toLowerCase()}</Badge>
                        <RecordViewingNoteForm viewingId={v.id} existingNotes={v.notesAfter} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Next action</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-ink-900">{notStatedOr(property.nextAction, "No next action set")}</p>
              {property.nextActionDue && (
                <p className="text-xs text-ink-500">Due {new Date(property.nextActionDue).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</p>
              )}
            </CardContent>
          </Card>

          <DuplicateCheckButton
            candidate={{
              id: property.id,
              address: property.address,
              postcode: property.postcode,
              listingUrl: property.listingUrl,
              reference: property.reference,
              agentName: property.agent?.name,
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {property.auditLogs.length === 0 ? (
                <p className="text-xs text-ink-500">No changes logged yet.</p>
              ) : (
                property.auditLogs.map((a) => (
                  <div key={a.id} className="text-xs text-ink-500">
                    <span className="text-ink-300">{new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span> — {a.summary}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
