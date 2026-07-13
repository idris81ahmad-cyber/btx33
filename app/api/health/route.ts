import { NextResponse } from "next/server";
import { getEnvReport, validateEnvOnce } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Public readiness probe — no secrets leaked.
 * Use for ops checks and post-deploy verification.
 */
export async function GET() {
  validateEnvOnce();
  const report = getEnvReport();

  return NextResponse.json(
    {
      service: "biyora-shop",
      ok: report.ok,
      flags: report.flags,
      missingCritical: report.missingCritical,
      warnings: report.warnings,
      timestamp: new Date().toISOString(),
    },
    { status: report.ok ? 200 : 503 },
  );
}
