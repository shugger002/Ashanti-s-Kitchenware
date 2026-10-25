"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CookieBanner = dynamic(() => import("@/components/store/cookie-banner").then((mod) => mod.CookieBanner));
const InstallPrompt = dynamic(() => import("@/components/store/install-prompt").then((mod) => mod.InstallPrompt));
const PromoPopup = dynamic(() => import("@/components/store/promo-popup").then((mod) => mod.PromoPopup));

export function DeferredStoreExtras() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return (
    <>
      <InstallPrompt />
      <PromoPopup />
      <CookieBanner />
    </>
  );
}
