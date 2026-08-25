/**
 * Guarded seed used by the Vercel build step (see "vercel-build" in
 * package.json). Seeds from the CRM snapshot only when the properties
 * table is empty, so redeploying an already-seeded/edited database never
 * wipes real changes made through the app.
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.property.count();
  if (count > 0) {
    console.log(`Database already has ${count} properties — skipping seed.`);
    return;
  }
  console.log("Database is empty — running the CRM snapshot seed...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main()
  .catch((e) => {
    // Never fail the build over a seed issue — a running app with an empty
    // database is recoverable; a failed deploy is not.
    console.error("Seed check failed (continuing build):", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
