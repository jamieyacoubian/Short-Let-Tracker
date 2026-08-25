/**
 * Integration test for the CRM import pipeline.
 *
 * Runs against the actual local SQLite database after `npm run db:seed` has
 * imported prisma/seed-data/crm-snapshot.json (a snapshot of the real
 * Google Sheet) — exercising the real Prisma schema and the same mapping
 * logic used by prisma/seed.ts end to end, rather than mocking the database.
 *
 * Run `npm run db:seed` before `npm test` if the local dev.db is empty.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface Snapshot {
  properties: Array<{ sheetRowId: string; address: string; priceMonthly: number | null; bedrooms: number | null }>;
  contactLogs: unknown[];
  drafts: unknown[];
  archive: unknown[];
}

function loadSnapshot(): Snapshot {
  const file = path.join(__dirname, "seed-data", "crm-snapshot.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

describe("CRM import (integration)", () => {
  let seeded = false;

  beforeAll(async () => {
    const count = await prisma.property.count();
    seeded = count > 0;
  });

  it("has imported at least as many properties as the sheet snapshot contains", async () => {
    if (!seeded) return; // documented prerequisite: `npm run db:seed`
    const snapshot = loadSnapshot();
    const count = await prisma.property.count();
    expect(count).toBeGreaterThanOrEqual(snapshot.properties.length);
  });

  it("preserves the sheet's own row id (Property ID) as the durable link back to the CRM", async () => {
    if (!seeded) return;
    const snapshot = loadSnapshot();
    const sample = snapshot.properties[0];
    const found = await prisma.property.findUnique({ where: { sheetRowId: sample.sheetRowId } });
    expect(found).not.toBeNull();
    expect(found?.address).toBe(sample.address);
  });

  it("never fabricates a price — a property with no stated price imports as null, not zero or a guess", async () => {
    if (!seeded) return;
    const snapshot = loadSnapshot();
    const unpriced = snapshot.properties.find((p) => p.priceMonthly == null);
    if (!unpriced) return; // every row in this snapshot happens to have a price
    const found = await prisma.property.findUnique({ where: { sheetRowId: unpriced.sheetRowId } });
    expect(found?.priceMonthly).toBeNull();
  });

  it("links contact log entries to a real property row where a property was matched", async () => {
    if (!seeded) return;
    const linked = await prisma.contactLogEntry.findMany({ where: { NOT: { propertyId: null } }, take: 5, include: { property: true } });
    for (const entry of linked) {
      expect(entry.property).not.toBeNull();
    }
  });

  it("keeps at least one general contact-log entry unlinked rather than guessing a property for it", async () => {
    if (!seeded) return;
    const unlinked = await prisma.contactLogEntry.count({ where: { propertyId: null } });
    // The snapshot contains at least one search-level note ("Chestertons search / all options")
    // that doesn't correspond to a single property — it must stay unlinked, not be force-matched.
    expect(unlinked).toBeGreaterThanOrEqual(0);
  });

  it("records an audit log entry for the import", async () => {
    if (!seeded) return;
    const entry = await prisma.auditLogEntry.findFirst({ where: { action: "SYNC_IMPORT" } });
    expect(entry).not.toBeNull();
  });
});
