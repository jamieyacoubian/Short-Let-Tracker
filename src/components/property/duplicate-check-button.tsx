"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { checkDuplicates } from "@/server/actions";
import type { DuplicateMatch } from "@/lib/duplicates";

export function DuplicateCheckButton({
  candidate,
}: {
  candidate: { id: string; address: string; postcode?: string | null; listingUrl?: string | null; reference?: string | null; agentName?: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<DuplicateMatch[] | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && results === null) {
          startTransition(async () => {
            const r = await checkDuplicates(candidate);
            setResults(r);
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="h-3.5 w-3.5" /> Check duplicates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate check</DialogTitle>
        </DialogHeader>
        {isPending && (
          <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking address, postcode, URL, reference and agent…
          </div>
        )}
        {!isPending && results && results.length === 0 && (
          <div className="flex items-center gap-2 rounded-md border border-sage-500/30 bg-sage-100 px-3 py-3 text-sm text-sage-700">
            <ShieldCheck className="h-4 w-4 shrink-0" /> No matches found — looks new.
          </div>
        )}
        {!isPending && results && results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`rounded-md border px-3 py-2 text-sm ${
                  r.confidence === "strong" ? "border-clay-600/30 bg-clay-100 text-clay-600" : "border-amber-600/30 bg-amber-100 text-amber-600"
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {r.confidence === "strong" ? "Likely duplicate" : "Possible duplicate"} (score {r.score})
                </div>
                <ul className="list-inside list-disc text-xs opacity-90">
                  {r.reasons.map((reason, j) => (
                    <li key={j}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
