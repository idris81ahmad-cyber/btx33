import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

/**
 * @vercel/postgres only reads POSTGRES_URL (not DATABASE_URL).
 * Neon/Vercel Marketplace often sets DATABASE_URL / POSTGRES_PRISMA_URL instead.
 * Normalize once, at runtime, before any query.
 */
export function ensurePostgresEnv(): string | null {
  if (!process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING ||
      "";
  }

  // Treat empty string as missing
  if (!process.env.POSTGRES_URL) {
    delete process.env.POSTGRES_URL;
    return null;
  }

  return process.env.POSTGRES_URL;
}

export function hasDatabase(): boolean {
  return Boolean(ensurePostgresEnv());
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
