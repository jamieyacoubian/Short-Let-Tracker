import { Mail, Phone, MessageCircle, Bot, User, CalendarClock, Flag, ExternalLink } from "lucide-react";
import type { Agent, ContactLogEntry } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { notStatedOr } from "@/lib/status";

const CHANNEL_ICON: Record<string, React.ElementType> = {
  EMAIL: Mail,
  PORTAL_FORM: Mail,
  PHONE: Phone,
  WHATSAPP: MessageCircle,
  SMS: MessageCircle,
  IN_PERSON: User,
  OTHER: Flag,
};

const EVENT_LABEL: Record<string, string> = {
  ENQUIRY_SENT: "Enquiry sent",
  AUTOMATED_ACKNOWLEDGEMENT: "Automated acknowledgement",
  AGENT_REPLY: "Agent reply",
  JAMIE_REPLY: "Jamie's reply",
  PHONE_CALL: "Phone call",
  WHATSAPP_EXCHANGE: "WhatsApp exchange",
  FOLLOW_UP: "Follow-up",
  VIEWING_BOOKED: "Viewing booked",
  VIEWING_COMPLETED: "Viewing completed",
  OUTCOME: "Outcome",
};

const MATCH_LABEL: Record<string, { label: string; variant: "sage" | "amber" | "ink" | "clay" }> = {
  CONFIRMED: { label: "Confirmed contact", variant: "sage" },
  ACTIVE_THREAD: { label: "Active thread", variant: "sage" },
  POSSIBLE_PORTAL_MATCH: { label: "Possible portal-form match", variant: "amber" },
  FOUND_NOT_CONTACTED: { label: "Found, not contacted", variant: "ink" },
  POSSIBLE_DUPLICATE: { label: "Possible duplicate", variant: "clay" },
};

export function Timeline({ entries }: { entries: (ContactLogEntry & { agent: Agent | null })[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-500">No contact logged yet for this property.</p>;
  }

  return (
    <ol className="relative flex flex-col gap-5 border-l border-border-soft pl-5">
      {entries.map((e) => {
        const Icon = e.eventType === "AUTOMATED_ACKNOWLEDGEMENT" ? Bot : CHANNEL_ICON[e.channel] ?? Flag;
        const match = MATCH_LABEL[e.matchConfidence];
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full border border-border-soft bg-paper">
              <Icon className="h-3 w-3 text-forest-700" />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-forest-900">{EVENT_LABEL[e.eventType] ?? e.eventType}</p>
              <Badge variant={e.direction === "OUTBOUND" ? "ink" : "sage"} className="text-[10px]">
                {e.direction === "OUTBOUND" ? "Outbound" : "Inbound"}
              </Badge>
              {!e.isSubstantive && (
                <Badge variant="ink" className="text-[10px]">
                  Automated
                </Badge>
              )}
              {match && (
                <Badge variant={match.variant} className="text-[10px]">
                  {match.label}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-ink-500">
              {new Date(e.occurredAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {e.agent && ` · ${e.agent.name}`}
            </p>
            {e.subject && <p className="mt-1 text-sm font-medium text-ink-900">{e.subject}</p>}
            {e.summary && <p className="mt-0.5 text-sm text-ink-700">{e.summary}</p>}
            {(e.sender || e.recipient) && (
              <p className="mt-0.5 text-xs text-ink-500">
                {e.sender && <>From: {e.sender} </>}
                {e.recipient && <>→ {e.recipient}</>}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {e.gmailMessageUrl && (
                <a href={e.gmailMessageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-forest-700 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Open in Gmail
                </a>
              )}
              {e.gmailThreadId && !e.gmailMessageUrl && (
                <span className="text-xs text-ink-300">Gmail ref: {e.gmailThreadId}</span>
              )}
              {e.nextAction && (
                <span className="flex items-center gap-1 text-xs text-terracotta-700">
                  <CalendarClock className="h-3 w-3" /> Next: {notStatedOr(e.nextAction)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
