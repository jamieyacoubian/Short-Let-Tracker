// Generates prisma/schema.production.prisma from prisma/schema.prisma by
// swapping the datasource provider to postgresql. Run at build time only
// (see "vercel-build" in package.json) so there is a single source of truth
// for the data model — this file is never hand-edited or committed.
//
// Also materializes DATABASE_URL into prisma/.env right now, once. Some
// hosting platforms' "live reference" environment variables (e.g. a value
// linked to another service) have been observed to resolve for the first
// `prisma` CLI call in a chained build command but not a later one in the
// same build — even though it's the same process environment. Writing the
// value to a file that Prisma auto-loads removes that platform-timing
// dependency: every subsequent `prisma generate` / `db push` call in this
// build reads the same materialized value instead of re-resolving it live.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const outPath = path.join(__dirname, "..", "prisma", "schema.production.prisma");
const envOutPath = path.join(__dirname, "..", "prisma", ".env");

const schema = readFileSync(srcPath, "utf-8");
const swapped = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

if (swapped === schema) {
  throw new Error('Could not find provider = "sqlite" in prisma/schema.prisma to swap — check the datasource block.');
}

writeFileSync(outPath, swapped);
console.log(`Wrote ${outPath} (postgresql datasource) from prisma/schema.prisma`);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set in the build environment. Set it in your hosting platform's " +
      "environment variables (pointing at a Postgres instance reachable from the BUILD step, " +
      "not just at runtime — some platforms' private/internal network hostnames only work for " +
      "already-running services, not the build container)."
  );
}
writeFileSync(envOutPath, `DATABASE_URL="${databaseUrl.replace(/"/g, '\\"')}"\n`);
console.log(`Wrote ${envOutPath} so every subsequent prisma command in this build sees the same DATABASE_URL.`);
