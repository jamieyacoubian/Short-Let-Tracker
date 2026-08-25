"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  contactLogInputSchema,
  draftInputSchema,
  viewingConfirmedRequiresExactTime,
} from "@/lib/schemas";
import { findDuplicateMatches, type DuplicateCandidate } from "@/lib/duplicates";
import type { PropertyStatus, RankTier, ViewingDecision } from "@prisma/client";
import { syncFromSheet, writeBackField } from "./integrations/sheets";

async function logAudit(propertyId: string | null, action: "CREATE" | "UPDATE" | "STATUS_CHANGE", entity: string, summary: string) {
  await prisma.auditLogEntry.create({
    data: { propertyId, action, entity, summary, actor: "jamie" },
  });
}

export async function updatePropertyStatus(propertyId: string, status: PropertyStatus) {
  const before = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
  const updated = await prisma.property.update({ where: { id: propertyId }, data: { status } });
  await logAudit(propertyId, "STATUS_CHANGE", "Property", `Status changed from ${before.status} to ${status}`);

  if (updated.sheetRowId) {
    // Best-effort write-back; failures are logged but never block the local status change.
    await writeBackField(updated.sheetRowId, "Contact Status", status.replace(/_/g, " ")).catch(() => null);
  }

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath(`/properties/${propertyId}`);
  return updated;
}

export async function updatePropertyRank(propertyId: string, rankTier: RankTier | null, rankScore: number | null) {
  const updated = await prisma.property.update({ where: { id: propertyId }, data: { rankTier, rankScore } });
  await logAudit(propertyId, "UPDATE", "Property", `Rank set to ${rankTier ?? "none"} (score ${rankScore ?? "—"})`);
  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath(`/properties/${propertyId}`);
  return updated;
}

export async function updatePropertyNextAction(propertyId: string, nextAction: string | null, nextActionDue: Date | null) {
  const updated = await prisma.property.update({ where: { id: propertyId }, data: { nextAction, nextActionDue } });
  await logAudit(propertyId, "UPDATE", "Property", `Next action set: ${nextAction ?? "cleared"}`);
  revalidatePath("/");
  revalidatePath(`/properties/${propertyId}`);
  return updated;
}

export async function addContactLogEntry(input: unknown) {
  const parsed = contactLogInputSchema.parse(input);
  const created = await prisma.contactLogEntry.create({ data: parsed });
  await logAudit(parsed.propertyId, "CREATE", "ContactLogEntry", `Logged ${parsed.eventType.replace(/_/g, " ").toLowerCase()} via ${parsed.channel.toLowerCase()}`);
  revalidatePath(`/properties/${parsed.propertyId}`);
  return created;
}

export async function addDraft(input: unknown) {
  const parsed = draftInputSchema.parse(input);
  const created = await prisma.draft.create({ data: parsed });
  await logAudit(parsed.propertyId, "CREATE", "Draft", `Prepared a ${parsed.channel.toLowerCase()} draft (${parsed.status.replace(/_/g, " ").toLowerCase()})`);
  revalidatePath("/drafts");
  revalidatePath(`/properties/${parsed.propertyId}`);
  return created;
}

export async function updateDraftStatus(draftId: string, status: "READY_NOT_SENT" | "SENT" | "HELD" | "SUPERSEDED" | "NEEDS_JAMIE_ANSWER") {
  const updated = await prisma.draft.update({ where: { id: draftId }, data: { status } });
  await logAudit(updated.propertyId, "UPDATE", "Draft", `Draft status set to ${status.replace(/_/g, " ").toLowerCase()}`);
  revalidatePath("/drafts");
  revalidatePath(`/properties/${updated.propertyId}`);
  return updated;
}

/**
 * Proposes or confirms a viewing. A CONFIRMED status is rejected unless an
 * exact start time is supplied — this is enforced both here and by the Zod
 * schema, so a proposed time slot can never be silently upgraded.
 */
export async function upsertViewing(input: unknown) {
  const parsed = viewingConfirmedRequiresExactTime.parse(input);
  const viewing = await prisma.viewing.create({
    data: {
      propertyId: parsed.propertyId,
      status: parsed.status,
      startAt: parsed.startAt,
      endAt: parsed.endAt,
      questionsToAsk: parsed.questionsToAsk,
      notesAfter: parsed.notesAfter,
      decision: parsed.decision,
    },
  });
  await logAudit(parsed.propertyId, "CREATE", "Viewing", `Viewing ${parsed.status.toLowerCase()}${parsed.startAt ? ` for ${parsed.startAt.toLocaleString("en-GB")}` : ""}`);
  if (parsed.status === "CONFIRMED") {
    await prisma.property.update({ where: { id: parsed.propertyId }, data: { status: "VIEWING_ARRANGED" } });
  }
  revalidatePath("/viewings");
  revalidatePath(`/properties/${parsed.propertyId}`);
  revalidatePath("/");
  return viewing;
}

export async function recordViewingNotes(viewingId: string, notesAfter: string, decision: ViewingDecision) {
  const updated = await prisma.viewing.update({
    where: { id: viewingId },
    data: { notesAfter, decision, status: "COMPLETED" },
  });
  await logAudit(updated.propertyId, "UPDATE", "Viewing", `Viewing notes recorded — decision: ${decision.toLowerCase()}`);
  revalidatePath("/viewings");
  revalidatePath(`/properties/${updated.propertyId}`);
  return updated;
}

/**
 * Runs duplicate detection for a candidate property against every existing
 * property, contact log label and archived lead. Intended to gate the
 * "Ready to enquire" transition.
 */
export async function checkDuplicates(candidate: DuplicateCandidate) {
  const [properties, archive] = await Promise.all([
    prisma.property.findMany({ include: { agent: true } }),
    prisma.archiveLead.findMany(),
  ]);

  const existing: DuplicateCandidate[] = [
    ...properties.map((p) => ({
      id: p.id,
      address: p.address,
      development: p.development,
      postcode: p.postcode,
      listingUrl: p.listingUrl,
      reference: p.reference,
      agentName: p.agent?.name,
      agentEmail: p.agent?.email,
    })),
    ...archive.map((a) => ({ id: a.sheetRowId ?? a.id, address: a.label })),
  ];

  return findDuplicateMatches(candidate, existing);
}

export async function runSheetsSync() {
  const result = await syncFromSheet();
  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/settings");
  return result;
}
