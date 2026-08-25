import Link from "next/link";
import { formatGBP, resolvePriceFigures } from "@/lib/pricing";
import { notStatedOr, ratingLabel, tristateLabel, RANK_LABEL } from "@/lib/status";
import { shortName } from "@/lib/assessment";
import { cn } from "@/lib/utils";
import type { PropertyCardData } from "@/components/property/property-card";

type Direction = "higher-better" | "lower-better" | "none";

interface Row {
  label: string;
  get: (p: PropertyCardData) => string;
  numeric?: (p: PropertyCardData) => number | null;
  direction?: Direction;
}

const ROWS: Row[] = [
  {
    label: "Price (pcm)",
    get: (p) => (p.priceMonthly ? formatGBP(p.priceMonthly) : "Not stated"),
    numeric: (p) => resolvePriceFigures(p).monthly,
    direction: "lower-better",
  },
  { label: "Square footage", get: (p) => (p.squareFeet ? `${p.squareFeet} sq ft` : "Not stated"), numeric: (p) => p.squareFeet, direction: "higher-better" },
  { label: "Bedrooms / bathrooms", get: (p) => `${p.bedrooms ?? "—"} / ${p.bathrooms ?? "—"}` },
  { label: "Short-let certainty", get: (p) => tristateLabel(p.shortLetConfirmed) },
  { label: "Furnishing", get: (p) => notStatedOr(p.furnished) },
  { label: "Bills", get: (p) => tristateLabel(p.billsIncluded) },
  { label: "WFH layout", get: (p) => tristateLabel(p.wfhSuitable), numeric: (p) => p.ratingWfh, direction: "higher-better" },
  { label: "Area", get: (p) => notStatedOr(p.neighbourhood) },
  { label: "Quietness", get: (p) => ratingLabel(p.ratingCalm), numeric: (p) => p.ratingCalm, direction: "higher-better" },
  { label: "Food / cafés", get: (p) => ratingLabel(p.ratingCafes), numeric: (p) => p.ratingCafes, direction: "higher-better" },
  { label: "Greenery", get: (p) => ratingLabel(p.ratingGreenery), numeric: (p) => p.ratingGreenery, direction: "higher-better" },
  { label: "Transport", get: (p) => ratingLabel(p.ratingTransport), numeric: (p) => p.ratingTransport, direction: "higher-better" },
  {
    label: "Viewing status",
    get: (p) => {
      const confirmed = p.viewings?.find((v) => v.status === "CONFIRMED");
      const proposed = p.viewings?.find((v) => v.status === "PROPOSED");
      return confirmed ? "Confirmed" : proposed ? "Proposed" : "None yet";
    },
  },
  { label: "Contact progress", get: (p) => p.status.replace(/_/g, " ").toLowerCase() },
  { label: "Main benefit", get: (p) => notStatedOr(p.whyItWorks) },
  { label: "Main risk", get: (p) => notStatedOr(p.watchOuts) },
  { label: "Overall rank", get: (p) => (p.rankTier ? RANK_LABEL[p.rankTier] : "Unranked") },
];

export function CompareTable({ properties }: { properties: PropertyCardData[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-soft bg-paper">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-soft">
            <th className="w-40 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-500">Property</th>
            {properties.map((p) => (
              <th key={p.id} className="min-w-[180px] px-4 py-3 text-left">
                <Link href={`/properties/${p.id}`} className="font-serif-display text-sm font-medium text-forest-900 hover:underline">
                  {shortName(p)}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const values = properties.map((p) => (row.numeric ? row.numeric(p) : null));
            const validValues = values.filter((v): v is number => v != null);
            const best = row.direction === "lower-better" ? Math.min(...validValues) : Math.max(...validValues);
            const worst = row.direction === "lower-better" ? Math.max(...validValues) : Math.min(...validValues);

            return (
              <tr key={row.label} className="border-b border-border-soft last:border-0">
                <td className="px-4 py-2.5 text-xs font-medium text-ink-500">{row.label}</td>
                {properties.map((p, i) => {
                  const v = values[i];
                  const isBest = row.direction && row.direction !== "none" && v != null && validValues.length > 1 && v === best;
                  const isWorst = row.direction && row.direction !== "none" && v != null && validValues.length > 1 && v === worst && best !== worst;
                  return (
                    <td
                      key={p.id}
                      className={cn(
                        "px-4 py-2.5 text-sm",
                        isBest && "bg-sage-100 font-medium text-sage-700",
                        isWorst && "bg-clay-100 text-clay-600"
                      )}
                    >
                      {row.get(p)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
