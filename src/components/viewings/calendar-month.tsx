import Link from "next/link";
import type { Property, Viewing } from "@prisma/client";
import { cn } from "@/lib/utils";
import { shortName } from "@/lib/assessment";

type ViewingWithProperty = Viewing & { property: Property };

export function CalendarMonth({ viewings, monthDate }: { viewings: ViewingWithProperty[]; monthDate: Date }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<number, ViewingWithProperty[]>();
  for (const v of viewings) {
    if (!v.startAt) continue;
    const d = new Date(v.startAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      byDay.set(day, [...(byDay.get(day) ?? []), v]);
    }
  }

  const cells: Array<number | null> = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div>
      <p className="mb-3 font-serif-display text-base font-medium text-forest-900">
        {monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border-soft bg-border-soft text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-ivory-soft px-2 py-1.5 text-center font-medium text-ink-500">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={cn("min-h-20 bg-paper p-1.5", day == null && "bg-ivory-soft/40")}>
            {day != null && (
              <>
                <p className={cn("mb-1 text-right text-[11px]", isCurrentMonth && day === today.getDate() ? "font-bold text-terracotta-600" : "text-ink-300")}>
                  {day}
                </p>
                <div className="flex flex-col gap-0.5">
                  {(byDay.get(day) ?? []).map((v) => (
                    <Link
                      key={v.id}
                      href={`/properties/${v.propertyId}`}
                      className={cn(
                        "block truncate rounded px-1 py-0.5 text-[10px] font-medium",
                        v.status === "CONFIRMED" ? "bg-terracotta-100 text-terracotta-700" : "bg-amber-100 text-amber-600"
                      )}
                    >
                      {v.startAt && new Date(v.startAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} {shortName(v.property)}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
