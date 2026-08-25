import { z } from "zod";

export const tristateSchema = z.enum(["YES", "NO", "UNKNOWN"]);

export const propertyStatusSchema = z.enum([
  "NEW",
  "READY_TO_ENQUIRE",
  "ENQUIRY_SENT",
  "AWAITING_REPLY",
  "ACTIVE_CONVERSATION",
  "VIEWING_ARRANGED",
  "STRONG_CONTENDER",
  "FOLLOW_UP_DUE",
  "HOLD",
  "UNAVAILABLE",
  "RULED_OUT",
  "LET_AGREED",
  "DUPLICATE",
]);

export const rankTierSchema = z.enum([
  "TOP_PICK",
  "STRONG_CONTENDER",
  "WORTH_CONSIDERING",
  "CONDITIONAL",
  "HOLD_VERIFY",
  "RULED_OUT",
]);

export const propertyInputSchema = z.object({
  address: z.string().min(3, "Address is required"),
  development: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  neighbourhood: z.string().optional().nullable(),
  listingUrl: z.string().url().optional().nullable().or(z.literal("")),
  reference: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),

  priceMonthly: z.number().positive().optional().nullable(),
  priceWeekly: z.number().positive().optional().nullable(),
  billsIncluded: tristateSchema.optional(),
  billsNotes: z.string().optional().nullable(),
  councilTaxNotes: z.string().optional().nullable(),
  wifiIncluded: tristateSchema.optional(),
  deposit: z.string().optional().nullable(),
  paymentBasis: z.string().optional().nullable(),

  bedrooms: z.number().int().min(0).max(20).optional().nullable(),
  bathrooms: z.number().int().min(0).max(20).optional().nullable(),
  squareFeet: z.number().int().positive().optional().nullable(),
  furnished: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  hasLift: tristateSchema.optional(),
  parking: z.string().optional().nullable(),
  outdoorSpace: z.string().optional().nullable(),
  broadband: z.string().optional().nullable(),

  availableFrom: z.string().optional().nullable(),
  minTermMonths: z.number().int().positive().optional().nullable(),
  maxTermMonths: z.number().int().positive().optional().nullable(),
  shortLetConfirmed: tristateSchema.optional(),

  status: propertyStatusSchema.optional(),
  rankTier: rankTierSchema.optional().nullable(),
  rankScore: z.number().int().min(0).max(100).optional().nullable(),
  nextAction: z.string().optional().nullable(),
  nextActionDue: z.coerce.date().optional().nullable(),
  wfhSuitable: tristateSchema.optional(),

  agentId: z.string().optional().nullable(),
});

export type PropertyInput = z.infer<typeof propertyInputSchema>;

export const contactLogInputSchema = z.object({
  propertyId: z.string(),
  agentId: z.string().optional().nullable(),
  occurredAt: z.coerce.date(),
  direction: z.enum(["OUTBOUND", "INBOUND"]),
  channel: z.enum(["EMAIL", "PORTAL_FORM", "PHONE", "WHATSAPP", "SMS", "IN_PERSON", "OTHER"]),
  eventType: z.enum([
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
  ]),
  sender: z.string().optional().nullable(),
  recipient: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  isSubstantive: z.boolean().default(true),
  gmailThreadId: z.string().optional().nullable(),
  gmailMessageUrl: z.string().optional().nullable(),
  matchConfidence: z
    .enum(["CONFIRMED", "POSSIBLE_PORTAL_MATCH", "FOUND_NOT_CONTACTED", "POSSIBLE_DUPLICATE", "ACTIVE_THREAD"])
    .default("CONFIRMED"),
  nextAction: z.string().optional().nullable(),
});

export const draftInputSchema = z.object({
  propertyId: z.string(),
  agentName: z.string().optional().nullable(),
  channel: z.enum(["EMAIL", "PORTAL_FORM"]),
  subject: z.string().optional().nullable(),
  body: z.string().min(1),
  status: z.enum(["READY_NOT_SENT", "SENT", "HELD", "SUPERSEDED", "NEEDS_JAMIE_ANSWER"]).default("READY_NOT_SENT"),
});

export const viewingInputSchema = z.object({
  propertyId: z.string(),
  status: z.enum(["PROPOSED", "CONFIRMED", "COMPLETED", "CANCELLED"]).default("PROPOSED"),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
  questionsToAsk: z.string().optional().nullable(),
  notesAfter: z.string().optional().nullable(),
  decision: z.enum(["PENDING", "PURSUE", "HOLD", "REJECT"]).default("PENDING"),
});

/**
 * A viewing can only ever be reported as CONFIRMED when it carries an exact
 * start time — a proposed slot or a range is never enough.
 */
export const viewingConfirmedRequiresExactTime = viewingInputSchema.refine(
  (data) => data.status !== "CONFIRMED" || data.startAt != null,
  { message: "A confirmed viewing requires an exact date and time.", path: ["startAt"] }
);
