"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { StatusBadge, RankBadge, TristateBadge } from "@/components/property/badges";
import { formatGBP } from "@/lib/pricing";
import { shortName } from "@/lib/assessment";
import type { PropertyCardData } from "@/components/property/property-card";

type SortKey = "rank" | "price" | "bedrooms" | "sqft" | "status" | "updated";

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "rank", label: "Rank" },
  { key: "price", label: "Price pcm" },
  { key: "bedrooms", label: "Beds" },
  { key: "sqft", label: "Sq ft" },
  { key: "status", label: "Status" },
  { key: "updated", label: "Updated" },
];

export function PropertiesTable({ properties }: { properties: PropertyCardData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [dir, setDir] = useState<1 | -1>(-1);

  const sorted = useMemo(() => {
    const copy = [...properties];
    copy.sort((a, b) => {
      let av = 0;
      let bv = 0;
      switch (sortKey) {
        case "rank":
          av = a.rankScore ?? -1;
          bv = b.rankScore ?? -1;
          break;
        case "price":
          av = a.priceMonthly ?? -1;
          bv = b.priceMonthly ?? -1;
          break;
        case "bedrooms":
          av = a.bedrooms ?? -1;
          bv = b.bedrooms ?? -1;
          break;
        case "sqft":
          av = a.squareFeet ?? -1;
          bv = b.squareFeet ?? -1;
          break;
        case "status":
          av = a.status.localeCompare(b.status);
          bv = 0;
          return av * dir;
        case "updated":
          av = new Date(a.updatedAt).getTime();
          bv = new Date(b.updatedAt).getTime();
          break;
      }
      return (av - bv) * dir;
    });
    return copy;
  }, [properties, sortKey, dir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDir((d) => (d === 1 ? -1 : 1) as 1 | -1);
    else {
      setSortKey(key);
      setDir(-1);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-soft bg-paper">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-ink-500">
            <th className="px-4 py-3 font-medium">Property</th>
            {COLUMNS.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium">
                <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-forest-800">
                  {c.label}
                  {sortKey === c.key ? dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                </button>
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Agent</th>
            <th className="px-4 py-3 font-medium">Bills</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-b border-border-soft last:border-0 hover:bg-ivory-soft">
              <td className="px-4 py-3">
                <Link href={`/properties/${p.id}`} className="block">
                  <p className="font-medium text-forest-900">{shortName(p)}</p>
                  <p className="text-xs text-ink-500">{p.neighbourhood ?? "Area not stated"}</p>
                </Link>
              </td>
              <td className="px-4 py-3">
                <RankBadge tier={p.rankTier} />
              </td>
              <td className="px-4 py-3 font-medium text-terracotta-700">{p.priceMonthly ? formatGBP(p.priceMonthly) : "—"}</td>
              <td className="px-4 py-3">{p.bedrooms ?? "—"}</td>
              <td className="px-4 py-3">{p.squareFeet ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-ink-500">{new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
              <td className="px-4 py-3 text-ink-700">{p.agent?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <TristateBadge value={p.billsIncluded} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
