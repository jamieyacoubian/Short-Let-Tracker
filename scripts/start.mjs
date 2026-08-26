// Wrapper for the "start" script (see package.json). Regenerates the
// postgres-flavoured Prisma Client immediately before `next start` (see
// prepare-postgres-schema.mjs for why), then launches the server.
//
// Some hosting platforms (Railway included) have been observed to show a
// reference-linked DATABASE_URL as configured, with a real resolved value,
// in their own dashboard — and to expose that same value during the build
// step — while still not injecting it into the actual running container's
// process environment at start. When that happens, fall back to the value
// the build step already wrote to prisma/.env (see prepare-postgres-schema.mjs)
// instead of failing outright: the file reflects the same DATABASE_URL the
// build used successfully, just not delivered through the platform's live
// runtime environment this time.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "prisma", ".env");

if (!process.env.DATABASE_URL && existsSync(envPath)) {
  const match = readFileSync(envPath, "utf-8").match(/^DATABASE_URL="(.*)"$/m);
  if (match) {
    process.env.DATABASE_URL = match[1].replace(/\\"/g, '"');
    console.log(
      "DATABASE_URL was not set in the process environment at start — falling back to the value materialized during build (prisma/.env)."
    );
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node", [path.join(__dirname, "prepare-postgres-schema.mjs")]);
run("npx", ["prisma", "generate", "--schema=prisma/schema.production.prisma"]);
run("npx", ["next", "start"]);
