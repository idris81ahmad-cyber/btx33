/**
 * Production error monitoring (Sentry-compatible).
 *
 * Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN to enable.
 * Without a DSN this is a no-op logger — safe for local/dev and builds.
 *
 * Uses Sentry's store endpoint via fetch so we don't require @sentry/nextjs
 * peer resolution during install. Optional package can still be added later.
 */

import { logger } from "@/lib/logger";

function getDsn(): string {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";
}

function parseDsn(dsn: string): {
  publicKey: string;
  host: string;
  projectId: string;
} | null {
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    const projectId = u.pathname.replace(/^\//, "").split("/")[0];
    if (!publicKey || !projectId) return null;
    return { publicKey, host: u.host, projectId };
  } catch {
    return null;
  }
}

export function isMonitoringEnabled(): boolean {
  return Boolean(getDsn());
}

export async function initMonitoring(
  runtime: "nodejs" | "edge" | "browser" = "nodejs",
) {
  if (!getDsn()) {
    logger.info("monitoring", "Sentry DSN not set — monitoring disabled", {
      runtime,
    });
    return;
  }
  logger.info("monitoring", "Sentry monitoring ready", { runtime });
}

async function sendToSentry(payload: Record<string, unknown>) {
  const dsn = getDsn();
  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const enabled =
    process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLE_DEV === "1";
  if (!enabled) return;

  const url = `https://${parsed.host}/api/${parsed.projectId}/store/`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=biyora-shop/0.1.0`,
      },
      body: JSON.stringify({
        ...payload,
        platform: "javascript",
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
        release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
        tags: { app: "biyora-shop" },
      }),
    });
  } catch {
    // never break the app for telemetry
  }
}

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error("monitoring", message, context);

  await sendToSentry({
    exception: {
      values: [
        {
          type: error instanceof Error ? error.name : "Error",
          value: message,
          stacktrace: stack
            ? {
                frames: stack
                  .split("\n")
                  .slice(1)
                  .map((line) => ({ filename: line.trim() })),
              }
            : undefined,
        },
      ],
    },
    extra: context,
    message,
  });
}

export async function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>,
) {
  if (level === "error") logger.error("monitoring", message, context);
  else if (level === "warning") logger.warn("monitoring", message, context);
  else logger.info("monitoring", message, context);

  await sendToSentry({
    message,
    level,
    extra: context,
  });
}
