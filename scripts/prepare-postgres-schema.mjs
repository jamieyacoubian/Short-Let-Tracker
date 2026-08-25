// Generates prisma/schema.production.prisma from prisma/schema.prisma by
// swapping the datasource provider to postgresql. Run at build time only
// (see "vercel-build" in package.json) so there is a single source of truth
// for the data model — this file is never hand-edited or committed.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const outPath = path.join(__dirname, "..", "prisma", "schema.production.prisma");

const schema = readFileSync(srcPath, "utf-8");
const swapped = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

if (swapped === schema) {
  throw new Error('Could not find provider = "sqlite" in prisma/schema.prisma to swap — check the datasource block.');
}

writeFileSync(outPath, swapped);
console.log(`Wrote ${outPath} (postgresql datasource) from prisma/schema.prisma`);
