"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABEL, STATUS_ORDER, RANK_LABEL, RANK_ORDER } from "@/lib/status";
import type { Agent } from "@prisma/client";

const TOGGLES: Array<{ key: string; label: string }> = [
  { key: "furnished", label: "Furnished" },
  { key: "billsIncluded", label: "Bills included" },
  { key: "shortLetConfirmed", label: "Short-let confirmed" },
  { key: "viewingArranged", label: "Viewing arranged" },
  { key: "wfhSuitable", label: "WFH suitable" },
];

export function FiltersBar({ agents, areas }: { agents: Agent[]; areas: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function toggle(key: string) {
    const active = searchParams.get(key) === "1";
    setParam(key, active ? null : "1");
  }

  const activeCount = [...searchParams.keys()].filter((k) => k !== "view").length;

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q || null);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search address, development, postcode, URL, reference, agent or email…"
            className="pl-9"
          />
        </form>
        <div className="flex gap-2">
          <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => setParam("status", v === "all" ? null : v)}>
            <SelectTrigger className="w-[168px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={searchParams.get("rankTier") ?? "all"} onValueChange={(v) => setParam("rankTier", v === "all" ? null : v)}>
            <SelectTrigger className="w-[156px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {RANK_ORDER.map((t) => (
                <SelectItem key={t} value={t}>
                  {RANK_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={searchParams.get("area") ?? "all"} onValueChange={(v) => setParam("area", v === "all" ? null : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get("agentId") ?? "all"} onValueChange={(v) => setParam("agentId", v === "all" ? null : v)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get("bedrooms") ?? "all"} onValueChange={(v) => setParam("bedrooms", v === "all" ? null : v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Bedrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any beds</SelectItem>
            {[1, 2, 3, 4].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} bed
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mx-1 hidden h-6 w-px bg-border-soft sm:block" />

        {TOGGLES.map((t) => {
          const active = searchParams.get(t.key) === "1";
          return (
            <button
              key={t.key}
              onClick={() => toggle(t.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-forest-700 bg-forest-800 text-ivory-soft"
                  : "border-border-strong bg-paper text-ink-700 hover:bg-ivory-soft"
              }`}
            >
              {t.label}
            </button>
          );
        })}

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)} className="gap-1 text-ink-500">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        {isPending && <SlidersHorizontal className="h-3.5 w-3.5 animate-pulse text-ink-300" />}
      </div>
    </div>
  );
}
