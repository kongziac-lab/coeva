import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

let database: NodePgDatabase<typeof schema> | null = null;
let pool: Pool | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (!database) {
    pool = new Pool({ connectionString: url, max: 10, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
    database = drizzle(pool, { schema });
  }
  return database;
}
