/**
 * Next.js instrumentation — runs once on server start.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initMonitoring } = await import("@/lib/monitoring");
    await initMonitoring("nodejs");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    const { initMonitoring } = await import("@/lib/monitoring");
    await initMonitoring("edge");
  }
}
