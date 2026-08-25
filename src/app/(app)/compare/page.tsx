import { Columns3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ComparePicker } from "@/components/compare/compare-picker";
import { CompareTable } from "@/components/compare/compare-table";
import { getAllProperties } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const allProperties = await getAllProperties();
  const selectedIds = (ids ?? "").split(",").filter(Boolean);
  const selected = selectedIds.map((id) => allProperties.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div>
      <PageHeader title="Compare properties" description="Select up to four properties to compare side by side. Strongest and weakest values are highlighted per row." />
      <div className="flex flex-col gap-6 px-4 lg:px-8">
        <ComparePicker properties={allProperties} />
        {selected.length === 0 ? (
          <EmptyState icon={Columns3} title="Nothing selected yet" description="Pick two to four properties above to compare them side by side." />
        ) : (
          <CompareTable properties={selected} />
        )}
      </div>
    </div>
  );
}
