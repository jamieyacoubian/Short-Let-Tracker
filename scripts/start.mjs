// Production start sequence: make sure the database exists and is seeded,
// then run the server.
//
// DATABASE_URL is optional here on purpose. Hosts that mount a persistent
// volume expose its in-container path (Railway sets RAILWAY_VOLUME_MOUNT_PATH),
// which is all we need to place the SQLite file — so rather than require the
// path to also be typed in by hand as an environment variable, derive it and
// only fall back to an explicit DATABASE_URL when one is set. Local dev is
// unaffected: .env sets DATABASE_URL, so that wins.
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

if (!process.env.DATABASE_URL) {
  const mountPath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (!mountPath) {
    console.warn(
      "No DATABASE_URL and no volume mount path detected — falling back to /data. " +
        "If this host has no persistent disk mounted there, the database will be " +
        "empty again after every restart."
    );
  }
  const dir = mountPath || "/data";
  mkdirSync(dir, { recursive: true });
  process.env.DATABASE_URL = `file:${path.join(dir, "prod.db")}`;
  console.log(`DATABASE_URL not set — using the mounted volume: ${process.env.DATABASE_URL}`);
} else {
  console.log("Using DATABASE_URL from the environment.");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    cwd: repoRoot,
  });
  if (result.error) {
    console.error(`Failed to run ${command}:`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"]);
run("npx", ["tsx", "prisma/seed-if-empty.ts"]);
run("npx", ["next", "start"]);
