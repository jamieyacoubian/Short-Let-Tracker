"use client";

import { useTransition } from "react";
import type { PropertyStatus, RankTier } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABEL, STATUS_ORDER, RANK_LABEL, RANK_ORDER } from "@/lib/status";
import { updatePropertyRank, updatePropertyStatus } from "@/server/actions";

export function StatusRankEditor({
  propertyId,
  status,
  rankTier,
}: {
  propertyId: string;
  status: PropertyStatus;
  rankTier: RankTier | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${isPending ? "opacity-60" : ""}`}>
      <Select
        value={status}
        onValueChange={(v) =>
          startTransition(() => {
            updatePropertyStatus(propertyId, v as PropertyStatus);
          })
        }
      >
        <SelectTrigger className="h-8 w-[190px] text-xs">
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
      <Select
        value={rankTier ?? "none"}
        onValueChange={(v) =>
          startTransition(() => {
            updatePropertyRank(propertyId, v === "none" ? null : (v as RankTier), null);
          })
        }
      >
        <SelectTrigger className="h-8 w-[170px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-xs">
            No tier set
          </SelectItem>
          {RANK_ORDER.map((t) => (
            <SelectItem key={t} value={t} className="text-xs">
              {RANK_LABEL[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
