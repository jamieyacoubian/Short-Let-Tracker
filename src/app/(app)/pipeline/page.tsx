import { LayoutGrid, Table2, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FiltersBar } from "@/components/pipeline/filters-bar";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { PropertiesTable } from "@/components/pipeline/properties-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgents, searchProperties } from "@/server/queries";
import type { PropertyStatus, RankTier } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  const properties = await searchProperties({
    q: sp.q,
    area: sp.area,
    status: sp.status as PropertyStatus | undefined,
    rankTier: sp.rankTier as RankTier | undefined,
    agentId: sp.agentId,
    bedrooms: sp.bedrooms ? Number(sp.bedrooms) : undefined,
    furnished: sp.furnished === "1",
    billsIncluded: sp.billsIncluded === "1",
    shortLetConfirmed: sp.shortLetConfirmed === "1",
    viewingArranged: sp.viewingArranged === "1",
    wfhSuitable: sp.wfhSuitable === "1",
  });

  const agents = await getAgents();
  const allProperties = await searchProperties({});
  const areas = Array.from(new Set(allProperties.map((p) => p.neighbourhood).filter(Boolean))).sort() as string[];

  return (
    <div>
      <PageHeader
        eyebrow={`${properties.length} of ${allProperties.length} properties`}
        title="Property pipeline"
        description="Every property found, from first sighting through to viewing and decision."
      />
      <FiltersBar agents={agents} areas={areas} />

      <div className="px-4 lg:px-8">
        {properties.length === 0 ? (
          <EmptyState icon={Building2} title="No properties match these filters" description="Try widening your search or clearing filters." />
        ) : (
          <Tabs defaultValue="kanban">
            <TabsList>
              <TabsTrigger value="kanban" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5">
                <Table2 className="h-3.5 w-3.5" /> Table
              </TabsTrigger>
            </TabsList>
            <TabsContent value="kanban">
              <KanbanBoard properties={properties} />
            </TabsContent>
            <TabsContent value="table">
              <PropertiesTable properties={properties} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
