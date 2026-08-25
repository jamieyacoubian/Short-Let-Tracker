"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { shortName } from "@/lib/assessment";
import type { PropertyCardData } from "@/components/property/property-card";

export function ComparePicker({ properties }: { properties: PropertyCardData[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedIds = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return properties;
    const low = q.toLowerCase();
    return properties.filter((p) => p.address.toLowerCase().includes(low) || p.development?.toLowerCase().includes(low));
  }, [properties, q]);

  function toggle(id: string) {
    let next: string[];
    if (selectedIds.includes(id)) {
      next = selectedIds.filter((x) => x !== id);
    } else {
      if (selectedIds.length >= 4) return;
      next = [...selectedIds, id];
    }
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set("ids", next.join(","));
    else params.delete("ids");
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-soft bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-forest-900">Choose up to 4 properties</p>
        <span className="text-xs text-ink-500">{selectedIds.length} / 4 selected</span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter properties…" className="pl-9" />
      </div>
      <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
        {filtered.map((p) => {
          const checked = selectedIds.includes(p.id);
          const disabled = !checked && selectedIds.length >= 4;
          return (
            <label
              key={p.id}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${disabled ? "opacity-40" : "cursor-pointer hover:bg-ivory-soft"}`}
            >
              <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => toggle(p.id)} />
              <span className="truncate">{shortName(p)}</span>
            </label>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <button
          onClick={() => router.push("/compare")}
          className="flex w-fit items-center gap-1 text-xs text-ink-500 hover:text-clay-600"
        >
          <X className="h-3 w-3" /> Clear selection
        </button>
      )}
    </div>
  );
}
