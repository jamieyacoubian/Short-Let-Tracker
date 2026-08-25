"use client";

import { useState, useTransition } from "react";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recordViewingNotes } from "@/server/actions";
import type { ViewingDecision } from "@prisma/client";

export function RecordViewingNoteForm({ viewingId, existingNotes }: { viewingId: string; existingNotes?: string | null }) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<ViewingDecision>("PENDING");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <NotebookPen className="h-3.5 w-3.5" /> Record notes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notes after viewing</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            startTransition(async () => {
              await recordViewingNotes(viewingId, (form.get("notesAfter") as string) ?? "", decision);
              setOpen(false);
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notesAfter">What did you see?</Label>
            <textarea
              id="notesAfter"
              name="notesAfter"
              rows={5}
              defaultValue={existingNotes ?? ""}
              className="rounded-md border border-border-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Decision</Label>
            <Select value={decision} onValueChange={(v) => setDecision(v as ViewingDecision)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Still deciding</SelectItem>
                <SelectItem value="PURSUE">Pursue</SelectItem>
                <SelectItem value="HOLD">Hold</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save notes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
