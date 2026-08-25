"use client";

import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertViewing } from "@/server/actions";

export function AddViewingForm({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"PROPOSED" | "CONFIRMED">("PROPOSED");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="h-3.5 w-3.5" /> Add viewing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose or confirm a viewing</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const startAt = form.get("startAt") as string;
            startTransition(async () => {
              await upsertViewing({
                propertyId,
                status,
                startAt: startAt ? new Date(startAt) : null,
                questionsToAsk: form.get("questionsToAsk") || null,
              });
              setOpen(false);
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "PROPOSED" | "CONFIRMED")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROPOSED">Proposed</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-ink-500">
              {status === "CONFIRMED"
                ? "Only mark this confirmed once an exact date and time is agreed."
                : "Use Proposed until an exact time is agreed with the agent."}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startAt">
              Date &amp; time {status === "CONFIRMED" && <span className="text-clay-600">*</span>}
            </Label>
            <Input id="startAt" name="startAt" type="datetime-local" required={status === "CONFIRMED"} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="questionsToAsk">Questions to ask</Label>
            <textarea
              id="questionsToAsk"
              name="questionsToAsk"
              rows={3}
              className="rounded-md border border-border-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save viewing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
