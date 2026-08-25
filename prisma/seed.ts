/**
 * Seeds the local database from a snapshot of the real Google Sheet
 * ("Jamie & Margaret — London Rental CRM", tabs: Property Pipeline, Contact
 * Log, Drafts, Agents & Sources, Archive & Leads) taken at build time and
 * checked into prisma/seed-data/crm-snapshot.json.
 *
 * This is not fabricated demo data — it is a point-in-time mirror of the
 * actual CRM, parsed with the same column mapping the live Sheets sync
 * adapter uses (see src/server/integrations/sheets.ts). Re-running the sync
 * once Google credentials are configured will bring the database back in
 * line with whatever the sheet says at that point.
 *
 * No property photographs are seeded: the sheet does not contain verifiably
 * linked image URLs, and the app's data-quality rules forbid guessing them.
 * Galleries start empty and show "No verified photos yet" until the image
 * adapter attaches real, provenance-tracked pictures.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- loosely-typed JSON snapshot, see Snapshot interface below */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface Snapshot {
  agents: Array<{
    key: string;
    name: string;
    branch: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  }>;
  properties: Array<Record<string, any>>;
  contactLogs: Array<Record<string, any>>;
  drafts: Array<Record<string, any>>;
  sources: Array<Record<string, any>>;
  archive: Array<Record<string, any>>;
}

function loadSnapshot(): Snapshot {
  const file = path.join(__dirname, "seed-data", "crm-snapshot.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

async function main() {
  const snap = loadSnapshot();

  console.log("Clearing existing data...");
  await prisma.auditLogEntry.deleteMany();
  await prisma.viewingMedia.deleteMany();
  await prisma.viewing.deleteMany();
  await prisma.transportLink.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.contactLogEntry.deleteMany();
  await prisma.property.deleteMany();
  await prisma.archiveLead.deleteMany();
  await prisma.source.deleteMany();
  await prisma.agent.deleteMany();

  console.log(`Seeding ${snap.agents.length} agents...`);
  const agentIdByKey = new Map<string, string>();
  for (const a of snap.agents) {
    const created = await prisma.agent.create({
      data: {
        name: a.name,
        branch: a.branch,
        email: a.email,
        phone: a.phone,
        notes: a.notes,
      },
    });
    agentIdByKey.set(a.key, created.id);
  }

  console.log(`Seeding ${snap.sources.length} sources...`);
  for (const s of snap.sources) {
    await prisma.source.create({
      data: {
        name: s.name,
        type: s.type,
        coverage: s.coverage,
        shortLetStrength: s.shortLetStrength,
        billsLikelihood: s.billsLikelihood,
        contactBranch: s.contactBranch,
        searchUrl: s.searchUrl,
        onBriefingWatchlist: !!s.onBriefingWatchlist,
        lastSearchedNote: s.lastSearchedNote,
        notes: s.notes,
      },
    });
  }

  console.log(`Seeding ${snap.properties.length} properties...`);
  const propertyIdBySheetId = new Map<string, string>();
  for (const p of snap.properties) {
    const agentId = p.agentKey ? agentIdByKey.get(p.agentKey) ?? null : null;
    const created = await prisma.property.create({
      data: {
        sheetRowId: p.sheetRowId,
        reference: p.reference,
        address: p.address,
        development: p.development,
        postcode: p.postcode,
        neighbourhood: p.neighbourhood,
        zone: p.zone,
        listingUrl: p.listingUrl,
        additionalUrls: p.additionalUrls?.length ? JSON.stringify(p.additionalUrls) : null,

        priceMonthly: p.priceMonthly,
        billsIncluded: p.billsIncluded,
        billsNotes: p.billsNotes,
        wifiIncluded: p.wifiIncluded,
        deposit: p.deposit,
        paymentBasis: p.paymentBasis,

        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        squareFeet: p.squareFeet,
        furnished: p.furnished,

        availableFrom: p.availableFrom,
        availableUntil: p.availableUntil,
        minTermMonths: p.minTermMonths,
        minTermNote: p.minTermNote,
        maxTermMonths: p.maxTermMonths,
        maxTermNote: p.maxTermNote,
        shortLetConfirmed: p.shortLetConfirmed,

        listingStatusNote: p.listingStatusNote,
        fitStatusNote: p.fitStatusNote,

        status: p.status,
        rankTier: p.rankTier,
        rankScore: p.rankScore,
        nextAction: p.nextAction,
        nextActionDue: p.nextActionDue ? new Date(p.nextActionDue) : null,
        wfhSuitable: p.wfhSuitable,

        whyItWorks: p.whyItWorks,
        watchOuts: p.watchOuts,
        wfhAssessment: p.wfhAssessment,
        quietnessAssessment: p.quietnessAssessment,
        valueAssessment: p.valueAssessment,

        ratingCalm: p.ratingCalm,
        ratingWfh: p.ratingWfh,

        lastVerifiedAt: p.lastVerifiedAt ? new Date(p.lastVerifiedAt) : null,
        duplicateNotes: p.duplicateNotes,

        sourceRow: JSON.stringify(p.sourceRow ?? {}),

        agentId,
      },
    });
    propertyIdBySheetId.set(p.sheetRowId, created.id);

    if (Array.isArray(p.transportLinks)) {
      for (let i = 0; i < p.transportLinks.length; i++) {
        const t = p.transportLinks[i];
        await prisma.transportLink.create({
          data: {
            propertyId: created.id,
            destination: t.destination,
            mode: t.mode,
            minMinutes: t.minMinutes,
            maxMinutes: t.maxMinutes,
            sortOrder: i,
          },
        });
      }
    }
  }

  console.log(`Seeding ${snap.contactLogs.length} contact log entries...`);
  for (const c of snap.contactLogs) {
    const propertyId = c.propertySheetId ? propertyIdBySheetId.get(c.propertySheetId) ?? null : null;
    let agentId: string | null = null;
    if (c.agentName) {
      const match = [...agentIdByKey.entries()].find(([key]) => key.startsWith(c.agentName.toLowerCase()));
      if (match) agentId = match[1];
    }
    const [sender, recipient] = (c.senderRecipient ?? "").split("→").map((s: string) => s?.trim());
    await prisma.contactLogEntry.create({
      data: {
        propertyId,
        propertyLabel: c.propertyLabel,
        agentId,
        occurredAt: new Date(c.occurredAt),
        direction: c.direction,
        channel: c.channel,
        eventType: c.eventType,
        sender: sender || null,
        recipient: recipient || null,
        subject: c.subject,
        summary: c.summary,
        isSubstantive: !!c.isSubstantive,
        gmailThreadId: c.gmailRef,
        matchConfidence: c.matchConfidence,
        nextAction: c.nextAction,
        sourceRow: JSON.stringify(c.sourceRow ?? {}),
      },
    });
  }

  console.log(`Seeding ${snap.drafts.length} drafts...`);
  for (const d of snap.drafts) {
    const propertyId = d.propertySheetId ? propertyIdBySheetId.get(d.propertySheetId) : null;
    if (!propertyId) {
      console.warn(`  skipping draft ${d.sheetRowId} — no matching property for ${d.propertySheetId}`);
      continue;
    }
    await prisma.draft.create({
      data: {
        sheetRowId: d.sheetRowId,
        propertyId,
        agentName: d.agentName,
        channel: d.channel,
        subject: d.subject,
        body: d.body,
        status: d.status,
        questionsCovered: d.questionsCovered,
        duplicateCheckNote: d.duplicateCheckNote,
        notes: d.notes,
        sourceRow: JSON.stringify(d.sourceRow ?? {}),
      },
    });
  }

  console.log(`Seeding ${snap.archive.length} archive leads...`);
  for (const a of snap.archive) {
    await prisma.archiveLead.create({
      data: {
        sheetRowId: a.sheetRowId,
        label: a.label,
        area: a.area,
        priceMonthly: a.priceMonthly,
        billsNote: a.billsNote,
        reasonStatus: a.reasonStatus,
        notes: a.notes,
        nextAction: a.nextAction,
        lastCheckedAt: a.lastCheckedAt ? new Date(a.lastCheckedAt) : null,
        sourceRow: JSON.stringify(a.sourceRow ?? {}),
      },
    });
  }

  // Confirmed / proposed viewings mirroring the Dashboard tab's "Viewings confirmed" note.
  console.log("Seeding viewings referenced on the Dashboard tab...");
  const lydfordId = propertyIdBySheetId.get("P042");
  const denholmeId = propertyIdBySheetId.get("P044");
  const blackwallId = propertyIdBySheetId.get("P039");

  if (lydfordId) {
    await prisma.viewing.create({
      data: {
        propertyId: lydfordId,
        status: "CONFIRMED",
        startAt: new Date("2026-08-26T12:30:00+01:00"),
        endAt: new Date("2026-08-26T13:00:00+01:00"),
        questionsToAsk:
          "Confirm bills/Wi-Fi package; room-by-room noise (road vs rear); whether third room genuinely works as a study; exact available dates.",
        decision: "PENDING",
      },
    });
  }
  if (denholmeId) {
    await prisma.viewing.create({
      data: {
        propertyId: denholmeId,
        status: "CONFIRMED",
        startAt: new Date("2026-08-26T15:00:00+01:00"),
        endAt: new Date("2026-08-26T15:30:00+01:00"),
        questionsToAsk:
          "Confirm bills/Wi-Fi, bathroom count, exact available dates and deposit — flagged as open on the CRM.",
        decision: "PENDING",
      },
    });
  }
  if (blackwallId) {
    await prisma.viewing.create({
      data: {
        propertyId: blackwallId,
        status: "PROPOSED",
        proposedTimes: JSON.stringify(["Thursday morning — exact time pending agent confirmation"]),
        questionsToAsk: "Confirm exact Thursday time; both-bedroom size; bills package.",
        decision: "PENDING",
      },
    });
  }

  await prisma.auditLogEntry.create({
    data: {
      action: "SYNC_IMPORT",
      entity: "CRM Sheet",
      summary: `Imported ${snap.properties.length} properties, ${snap.contactLogs.length} contact log entries, ${snap.drafts.length} drafts, ${snap.sources.length} sources and ${snap.archive.length} archive leads from the Google Sheet snapshot.`,
      actor: "seed-script",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
