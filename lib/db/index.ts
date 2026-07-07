import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

export function hasDatabase(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!hasDatabase()) return null;
  if (!_db) {
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export { schema };