"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getCookieConsentState,
  hydrateCookieConsent,
  subscribeCookieConsent,
} from "@/components/store/cookie-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function loadGoogle(measurementId: string) {
  if (document.getElementById("ga4-src")) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("consent", "default", { analytics_storage: "denied" });
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("config", measurementId, { anonymize_ip: true });
  const script = document.createElement("script");
  script.id = "ga4-src";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function AnalyticsTracker({ measurementId }: { measurementId: string | null }) {
  const path = usePathname();

  useEffect(() => {
    hydrateCookieConsent();
    const send = (pathname: string) => {
      if (getCookieConsentState().consent !== "accepted") return;
      if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
      void fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
        keepalive: true,
      });
      if (measurementId) {
        const firstLoad = !document.getElementById("ga4-src");
        loadGoogle(measurementId);
        if (!firstLoad) window.gtag?.("event", "page_view", { page_path: pathname });
      }
    };
    send(path);
    const unsubscribe = subscribeCookieConsent(() => {
      if (getCookieConsentState().consent === "accepted") send(path);
    });
    return () => {
      unsubscribe();
    };
  }, [path, measurementId]);

  return null;
}
