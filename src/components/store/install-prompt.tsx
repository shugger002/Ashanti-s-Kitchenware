"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download, MessageCircle, WifiOff, Zap } from "lucide-react";
import { brand } from "@/config/brand";
import { buttonClass } from "@/components/ui/button";

const HIDE_KEY = "ak_a2hs_hide";
const LATER_KEY = "ak_a2hs_later";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const crios = /CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return ios && webkit && !crios;
}

export function InstallPrompt() {
  const titleId = useId();
  const addRef = useRef<HTMLButtonElement>(null);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState("");
  const [help, setHelp] = useState<"ios" | "menu" | null>(null);

  useEffect(() => {
    setHost(window.location.host);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(HIDE_KEY) === "1") return;
      if (sessionStorage.getItem(LATER_KEY) === "1") return;
    } catch {
      return;
    }

    function onPrompt(event: Event) {
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
    }
    window.addEventListener("beforeinstallprompt", onPrompt);

    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
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
      localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  async function addToHome() {
    if (deferred.current) {
      await deferred.current.prompt();
      const { outcome } = await deferred.current.userChoice;
      deferred.current = null;
      if (outcome === "accepted") {
        try {
          localStorage.setItem(HIDE_KEY, "1");
        } catch {
          /* ignore */
        }
        setOpen(false);
      }
      return;
    }
    setHelp(isIosSafari() ? "ios" : "menu");
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
            src="/icons/icon-192.png"
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-2xl border border-border bg-[#f6f1ea] object-cover"
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

        {help === "ios" ? (
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
            <li>Tap the Share button in Safari.</li>
            <li>Scroll and tap Add to Home Screen.</li>
            <li>Tap Add.</li>
          </ol>
        ) : help === "menu" ? (
          <p className="mt-5 text-sm leading-relaxed text-foreground">
            Open your browser menu and tap Install app or Add to Home Screen.
          </p>
        ) : null}

        <button
          ref={addRef}
          type="button"
          className={buttonClass("primary", "mt-5 h-12 w-full gap-2 rounded-full text-base")}
          onClick={() => void addToHome()}
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
