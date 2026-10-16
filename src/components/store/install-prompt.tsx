"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download, MessageCircle, Share, WifiOff, Zap } from "lucide-react";
import { brand } from "@/config/brand";
import { buttonClass } from "@/components/ui/button";

const NEVER_KEY = "ak_a2hs_optout";
const LATER_KEY = "ak_a2hs_later";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __akDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

function isStandalone() {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosDevice() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallPrompt() {
  const titleId = useId();
  const addRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState("");
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setHost(window.location.host);
    setIos(isIosDevice());
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    const path = window.location.pathname;
    if (path === "/login" || path === "/register" || path === "/account" || path.startsWith("/admin")) return;
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(NEVER_KEY) === "1") return;
      if (sessionStorage.getItem(LATER_KEY) === "1") return;
    } catch {
      return;
    }

    function onPrompt(event: Event) {
      event.preventDefault();
      window.__akDeferredPrompt = event as BeforeInstallPromptEvent;
    }
    function onInstalled() {
      setOpen(false);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    addRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") later();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function later() {
    try {
      sessionStorage.setItem(LATER_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function never() {
    try {
      localStorage.setItem(NEVER_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function addToHome() {
    if (isIosDevice()) {
      setHelp(true);
      return;
    }
    const event = window.__akDeferredPrompt;
    if (event?.prompt) {
      window.__akDeferredPrompt = null;
      setOpen(false);
      void event.prompt().catch(() => {
        setHelp(true);
        setOpen(true);
      });
      return;
    }
    setHelp(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[1.75rem] bg-white px-5 pb-6 pt-6 shadow-[0_24px_60px_rgba(26,26,26,0.18)]"
      >
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/app-192.png"
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-2xl border border-border object-cover"
          />
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold leading-tight text-foreground">
              {brand.name}
            </h2>
            {host ? <p className="mt-0.5 truncate text-sm text-muted">{host}</p> : null}
            <p className="mt-1 text-xs text-muted">Shopping · Accra</p>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-3 gap-2">
          {[
            { icon: Zap, label: "Lightning Fast" },
            { icon: WifiOff, label: "Works Offline" },
            { icon: MessageCircle, label: "WhatsApp us" },
          ].map((item) => (
            <li
              key={item.label}
              className="flex flex-col items-center rounded-2xl bg-[#f6f1ea] px-2 py-4 text-center"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-white text-accent">
                <item.icon className="size-5" aria-hidden />
              </span>
              <span className="mt-2 text-[11px] font-medium leading-tight text-foreground">{item.label}</span>
            </li>
          ))}
        </ul>

        {help && ios ? (
          <ol className="mt-5 space-y-3 text-sm leading-relaxed text-foreground">
            <li className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f6f1ea] text-accent">
                <Share className="size-4" aria-hidden />
              </span>
              <span>Tap the Share button (square with an arrow).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f6f1ea] text-sm font-medium">
                2
              </span>
              <span>Scroll and tap Add to Home Screen.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f6f1ea] text-sm font-medium">
                3
              </span>
              <span>Tap Add.</span>
            </li>
          </ol>
        ) : help ? (
          <ol className="mt-5 space-y-2 text-sm leading-relaxed text-foreground">
            <li>1. Open the browser menu (⋮).</li>
            <li>2. Tap Install app or Add to Home Screen.</li>
            <li>3. Confirm Add.</li>
          </ol>
        ) : null}

        <button
          ref={addRef}
          type="button"
          className={buttonClass("primary", "mt-5 h-12 w-full gap-2 rounded-full text-base")}
          onClick={addToHome}
        >
          <Download className="size-4" aria-hidden />
          Add to Home Screen
        </button>

        <button type="button" className="mt-4 flex h-11 w-full items-center justify-center text-sm text-muted" onClick={later}>
          Maybe Later
        </button>
        <button type="button" className="mx-auto mt-1 block text-xs text-muted/80" onClick={never}>
          Don&apos;t show again
        </button>
      </div>
    </div>
  );
}
