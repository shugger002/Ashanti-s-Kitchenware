"use client";

import { useEffect, useId, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __akDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

type Help = "ios-safari" | "ios-other" | "menu";

function installedAlready() {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function helpKind(): Help {
  const ua = window.navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!ios) return "menu";
  const inApp = /(FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|TikTok|Snapchat|Pinterest)/i.test(ua);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua);
  if (inApp || otherBrowser) return "ios-other";
  return "ios-safari";
}

export function AddToScreen({ className }: { className?: string }) {
  const titleId = useId();
  const [hidden, setHidden] = useState(true);
  const [help, setHelp] = useState<Help | null>(null);

  useEffect(() => {
    if (installedAlready()) return;
    setHidden(false);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    function onInstalled() {
      setHidden(true);
      setHelp(null);
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  useEffect(() => {
    if (!help) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setHelp(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [help]);

  async function add() {
    const kind = helpKind();
    if (kind !== "menu") {
      setHelp(kind);
      return;
    }
    const event = window.__akDeferredPrompt;
    if (!event?.prompt) {
      setHelp("menu");
      return;
    }
    window.__akDeferredPrompt = null;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") setHidden(true);
    } catch {
      setHelp("menu");
    }
  }

  if (hidden && !help) return null;

  return (
    <>
      {hidden ? null : (
        <button type="button" className={className} onClick={() => void add()}>
          Add to screen
        </button>
      )}
      {help ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-foreground shadow-[var(--shadow)]"
          >
            <h2 id={titleId} className="text-xl">
              Add to screen
            </h2>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-800">
              {help === "ios-other" ? (
                <>
                  <li>Open this desk in Safari. Chrome and WhatsApp cannot add it.</li>
                  <li>In Safari, tap Share, then Add to Home Screen, then Add.</li>
                </>
              ) : help === "ios-safari" ? (
                <>
                  <li>Tap Share at the bottom of Safari.</li>
                  <li>Tap Add to Home Screen, then Add.</li>
                </>
              ) : (
                <>
                  <li>Open the browser menu.</li>
                  <li>Tap Install app or Add to Home screen, then confirm.</li>
                </>
              )}
            </ol>
            <p className="mt-3 text-sm text-muted">The new icon opens this desk.</p>
            <button
              type="button"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm text-white"
              onClick={() => setHelp(null)}
              autoFocus
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
