import { cn } from "@/lib/utils";

export function FactRow({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-soft py-2 text-sm last:border-0">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className={cn("text-right font-medium text-ink-900", muted && "italic font-normal text-ink-300")}>{value}</dd>
    </div>
  );
}
