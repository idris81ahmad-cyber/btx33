"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Avoid SW on localhost unless forced (easier dev)
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocal && process.env.NEXT_PUBLIC_PWA_DEV !== "1") return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        /* ignore registration failures */
      });
  }, []);

  return null;
}
