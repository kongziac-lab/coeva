import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

let schemaPromise: Promise<void> | undefined;

/**
 * Keeps deployments created before Google Workspace login compatible.
 * The statements are idempotent and run once per server process.
 */
export function ensureGoogleAdminSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getDb();
      await db.execute(sql`ALTER TABLE "admins" ALTER COLUMN "password_hash" DROP NOT NULL`);
      await db.execute(sql`ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "google_subject" text`);
      await db.execute(sql`ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "admins_google_subject_idx" ON "admins" ("google_subject")`);
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }

  return schemaPromise;
}
