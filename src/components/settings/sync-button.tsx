"use client";

import { useState, useTransition } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runSheetsSync } from "@/server/actions";
import type { SyncResult } from "@/server/integrations/sheets";

export function SyncButton({ disabled }: { disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || isPending}
        onClick={() =>
          startTransition(async () => {
            const r = await runSheetsSync();
            setResult(r);
          })
        }
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Syncing…" : "Sync now from Google Sheets"}
      </Button>
      {result && (
        <div className={`flex items-start gap-1.5 text-xs ${result.errors.length ? "text-amber-600" : "text-sage-700"}`}>
          {result.errors.length ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>
            {result.propertiesUpserted} properties synced.
            {result.errors.length > 0 && <> {result.errors.join(" ")}</>}
          </span>
        </div>
      )}
    </div>
  );
}
