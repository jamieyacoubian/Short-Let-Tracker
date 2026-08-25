"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { addContactLogEntry } from "@/server/actions";

const CHANNELS = ["EMAIL", "PORTAL_FORM", "PHONE", "WHATSAPP", "SMS", "IN_PERSON", "OTHER"];
const DIRECTIONS = ["OUTBOUND", "INBOUND"];
const EVENT_TYPES = [
  "ENQUIRY_SENT",
  "AUTOMATED_ACKNOWLEDGEMENT",
  "AGENT_REPLY",
  "JAMIE_REPLY",
  "PHONE_CALL",
  "WHATSAPP_EXCHANGE",
  "FOLLOW_UP",
  "VIEWING_BOOKED",
  "VIEWING_COMPLETED",
  "OUTCOME",
];

export function AddContactLogForm({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Log contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a contact event</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            startTransition(async () => {
              await addContactLogEntry({
                propertyId,
                occurredAt: new Date(form.get("occurredAt") as string),
                direction: form.get("direction"),
                channel: form.get("channel"),
                eventType: form.get("eventType"),
                subject: form.get("subject") || null,
                summary: form.get("summary") || null,
                isSubstantive: form.get("isSubstantive") === "on",
                nextAction: form.get("nextAction") || null,
              });
              setOpen(false);
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="occurredAt">When</Label>
            <Input id="occurredAt" name="occurredAt" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Direction</Label>
              <Select name="direction" defaultValue="OUTBOUND">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d === "OUTBOUND" ? "Outbound" : "Inbound"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Channel</Label>
              <Select name="channel" defaultValue="EMAIL">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Event type</Label>
            <Select name="eventType" defaultValue="AGENT_REPLY">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" placeholder="Optional" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="summary">Summary</Label>
            <textarea
              id="summary"
              name="summary"
              rows={3}
              className="rounded-md border border-border-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
              placeholder="What happened, concisely"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nextAction">Next action</Label>
            <Input id="nextAction" name="nextAction" placeholder="Optional" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <Checkbox name="isSubstantive" defaultChecked />
            Substantive (not an automated acknowledgement)
          </label>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
