import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "default" | "terracotta" | "amber" | "clay" | "sage";
  href?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "text-forest-800",
    terracotta: "text-terracotta-600",
    amber: "text-amber-600",
    clay: "text-clay-600",
    sage: "text-sage-700",
  };

  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-paper p-4 shadow-[0_1px_2px_rgba(30,63,41,0.05)] transition-shadow hover:shadow-sm">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ivory-soft", toneClasses[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className={cn("font-serif-display text-xl font-medium leading-none", toneClasses[tone])}>{value}</p>
        <p className="mt-1 text-xs leading-snug text-ink-500">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return content;
}
