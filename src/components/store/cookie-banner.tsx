"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  closeCookieSettings,
  getCookieConsentState,
  hydrateCookieConsent,
  openCookieSettings,
  setCookieConsent,
  subscribeCookieConsent,
} from "@/components/store/cookie-consent";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const state = useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentState,
    getCookieConsentState,
  );

  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateCookieConsent();
    setReady(true);
  }, []);

  const visible = ready && (state.panelOpen || state.consent === null);
  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(var(--store-dock)+env(safe-area-inset-bottom))] z-[70] border-t border-border bg-surface p-3 lg:bottom-0 lg:z-50 md:p-5"
      role="dialog"
      aria-labelledby="cookie-title"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="max-w-2xl">
          <p id="cookie-title" className="font-medium">
            Cookies
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
            Necessary cookies keep the cart and sign-in working. Optional analytics cookies count shop
            visits after you accept.{" "}
            <Link href="/cookies" className="underline">
              Cookie policy
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="secondary" className="h-12 w-full sm:w-auto" onClick={() => setCookieConsent("rejected")}>
            Reject optional
          </Button>
          <Button type="button" className="h-12 w-full sm:w-auto" onClick={() => setCookieConsent("accepted")}>
            Accept all
          </Button>
          {state.consent ? (
            <Button type="button" variant="ghost" className="h-12 w-full sm:w-auto" onClick={() => closeCookieSettings()}>
              Close
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "text-xs text-muted hover:text-foreground"}
      onClick={() => {
        hydrateCookieConsent();
        openCookieSettings();
      }}
    >
      Cookie settings
    </button>
  );
}
