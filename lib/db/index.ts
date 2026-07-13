import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";
import { ensureDatabaseUrl } from "@/lib/env";

/** @deprecated Prefer ensureDatabaseUrl from @/lib/env — kept for existing imports. */
export function ensurePostgresEnv(): string | null {
  return ensureDatabaseUrl();
}

export function hasDatabase(): boolean {
  return Boolean(ensureDatabaseUrl());
}

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!ensurePostgresEnv()) return null;
  if (!cachedDb) {
    cachedDb = drizzle(sql, { schema });
  }
  return cachedDb;
}

export { schema };
