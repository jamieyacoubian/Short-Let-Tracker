import { Badge } from "@/components/ui/badge";
import type { PropertyStatus, RankTier, Tristate } from "@prisma/client";
import { RANK_COLOR, RANK_LABEL, STATUS_COLOR, STATUS_LABEL, tristateColor } from "@/lib/status";

export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  return (
    <Badge variant={STATUS_COLOR[status] === "default" ? "default" : STATUS_COLOR[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function RankBadge({ tier, className }: { tier: RankTier | null; className?: string }) {
  if (!tier) return <Badge variant="ink" className={className}>Unranked</Badge>;
  return (
    <Badge variant={RANK_COLOR[tier] === "default" ? "default" : RANK_COLOR[tier]} className={className}>
      {RANK_LABEL[tier]}
    </Badge>
  );
}

export function TristateBadge({ value, yesLabel, noLabel, className }: { value: Tristate; yesLabel?: string; noLabel?: string; className?: string }) {
  const label = value === "YES" ? yesLabel ?? "Yes" : value === "NO" ? noLabel ?? "No" : "Unknown";
  return (
    <Badge variant={tristateColor(value)} className={className}>
      {label}
    </Badge>
  );
}
