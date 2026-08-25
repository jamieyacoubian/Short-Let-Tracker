import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getDrafts } from "@/server/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyDraftButton } from "@/components/property/copy-draft-button";
import { shortName } from "@/lib/assessment";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "sage" | "ink" | "amber" | "clay"> = {
  READY_NOT_SENT: "sage",
  SENT: "ink",
  HELD: "amber",
  SUPERSEDED: "clay",
  NEEDS_JAMIE_ANSWER: "amber",
};

export default async function DraftsPage() {
  const drafts = await getDrafts();

  return (
    <div>
      <PageHeader
        eyebrow={`${drafts.length} drafts`}
        title="Drafts &amp; prepared messages"
        description="Enquiry and reply text ready to copy — nothing here is ever sent automatically."
      />
      <div className="flex flex-col gap-4 px-4 lg:px-8">
        {drafts.length === 0 ? (
          <EmptyState icon={FileText} title="No drafts yet" description="Prepared messages will appear here once added from a property's page." />
        ) : (
          drafts.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    <Link href={`/properties/${d.propertyId}`} className="hover:underline">
                      {shortName(d.property)}
                    </Link>
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {d.agentName ?? "Agent not stated"} · {d.channel === "EMAIL" ? "Email" : "Portal form"} · {d.body.length} characters · prepared{" "}
                    {new Date(d.preparedAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <Badge variant={STATUS_TONE[d.status] ?? "ink"}>{d.status.replace(/_/g, " ").toLowerCase()}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {d.subject && <p className="text-sm font-medium text-ink-900">{d.subject}</p>}
                <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md bg-ivory-soft p-3 text-xs text-ink-700">{d.body}</pre>
                {d.questionsCovered && <p className="text-xs text-ink-500">Covers: {d.questionsCovered}</p>}
                {d.duplicateCheckNote && <p className="text-xs text-amber-600">Duplicate check: {d.duplicateCheckNote}</p>}
                <div>
                  <CopyDraftButton text={d.body} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
