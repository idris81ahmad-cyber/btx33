"use client";

import { useEffect } from "react";

/** Client-side Sentry bootstrap (no-op without DSN). */
export default function MonitoringInit() {
  useEffect(() => {
    void import("@/lib/monitoring").then((m) => m.initMonitoring("browser"));
  }, []);
  return null;
}
