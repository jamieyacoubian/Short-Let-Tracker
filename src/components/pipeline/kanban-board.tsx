"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { PropertyStatus } from "@prisma/client";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/status";
import { RankBadge } from "@/components/property/badges";
import { formatGBP } from "@/lib/pricing";
import { shortName } from "@/lib/assessment";
import { updatePropertyStatus } from "@/server/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PropertyCardData } from "@/components/property/property-card";

export function KanbanBoard({ properties }: { properties: PropertyCardData[] }) {
  const [isPending, startTransition] = useTransition();

  const columns = STATUS_ORDER.map((status) => ({
    status,
    items: properties.filter((p) => p.status === status),
  })).filter((c) => c.items.length > 0);

  function handleStatusChange(propertyId: string, status: PropertyStatus) {
    startTransition(() => {
      updatePropertyStatus(propertyId, status);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.status} className="flex w-72 shrink-0 flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-forest-900">{STATUS_LABEL[col.status]}</h3>
            <span className="rounded-full bg-ivory-soft px-2 py-0.5 text-xs text-ink-500">{col.items.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {col.items.map((p) => (
              <div key={p.id} className={`rounded-lg border border-border-soft bg-paper p-3 shadow-sm ${isPending ? "opacity-70" : ""}`}>
                <Link href={`/properties/${p.id}`} className="block">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug text-forest-900">{shortName(p)}</p>
                    <RankBadge tier={p.rankTier} className="shrink-0" />
                  </div>
                  <p className="text-xs text-ink-500">{p.neighbourhood ?? "Area not stated"}</p>
                  <p className="mt-1 text-sm font-medium text-terracotta-700">
                    {p.priceMonthly ? `${formatGBP(p.priceMonthly)} pcm` : "Price not stated"}
                  </p>
                </Link>
                <div className="mt-2">
                  <Select value={p.status} onValueChange={(v) => handleStatusChange(p.id, v as PropertyStatus)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
