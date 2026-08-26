// Generates prisma/schema.production.prisma from prisma/schema.prisma by
// swapping the datasource provider to postgresql. Run both at build time
// ("vercel-build" in package.json) and again right before the server starts
// ("start" in package.json), so there is a single source of truth for the
// data model — this file is never hand-edited or committed.
//
// Why also at start: some hosting platforms (Railway included) reinstall
// dependencies for the runtime container separately from the build step,
// which re-triggers "postinstall" (`prisma generate` against the plain,
// sqlite-flavoured prisma/schema.prisma) and silently overwrites the
// postgres-flavoured client the build produced — the app then boots with a
// client that rejects a postgres:// URL outright. Regenerating from the
// postgres schema immediately before `next start` guarantees the client
// actually running matches the schema in this file, regardless of what
// happened to node_modules in between.
//
// Also materializes DATABASE_URL into prisma/.env right now, once per run.
// Some hosting platforms' "live reference" environment variables (e.g. a
// value linked to another service) have been observed to resolve for the
// first `prisma` CLI call in a chained command but not a later one, even
// though it's the same process environment. Writing the value to a file
// that Prisma auto-loads removes that platform-timing dependency.
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
    "DATABASE_URL is not set in this environment (build or start). Set it in your hosting " +
      "platform's environment variables, pointing at a Postgres instance reachable from BOTH " +
      "the build step and the running container — some platforms' private/internal network " +
      "hostnames only work for one of the two, not both."
  );
}
writeFileSync(envOutPath, `DATABASE_URL="${databaseUrl.replace(/"/g, '\\"')}"\n`);
console.log(`Wrote ${envOutPath} so every subsequent prisma command in this run sees the same DATABASE_URL.`);
