/**
 * Lightweight structured logger.
 * - info/debug are suppressed in production (use Vercel log drains for ops noise)
 * - warn/error always emit (needed for support + Paystack retries)
 */

type LogFields = Record<string, unknown>;

function format(scope: string, message: string, fields?: LogFields): string {
  if (!fields || Object.keys(fields).length === 0) {
    return `[${scope}] ${message}`;
  }
  try {
    return `[${scope}] ${message} ${JSON.stringify(fields)}`;
  } catch {
    return `[${scope}] ${message}`;
  }
}

const isProd = process.env.NODE_ENV === "production";

export const logger = {
  debug(scope: string, message: string, fields?: LogFields) {
    if (isProd) return;
    console.debug(format(scope, message, fields));
  },
  info(scope: string, message: string, fields?: LogFields) {
    if (isProd) return;
    console.log(format(scope, message, fields));
  },
  /** Always logs — operational signals (webhook received, email demo, etc.) */
  ops(scope: string, message: string, fields?: LogFields) {
    console.log(format(scope, message, fields));
  },
  warn(scope: string, message: string, fields?: LogFields) {
    console.warn(format(scope, message, fields));
  },
  error(scope: string, message: string, fields?: LogFields) {
    console.error(format(scope, message, fields));
  },
};
