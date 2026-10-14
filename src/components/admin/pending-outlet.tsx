"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";

function adminHref(href: string, origin: string) {
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return null;
    if (!url.pathname.startsWith("/admin")) return null;
    if (
      url.pathname === "/admin/login" ||
      url.pathname.startsWith("/admin/forgot-password") ||
      url.pathname.startsWith("/admin/reset-password")
    ) {
      return null;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function useAdminPagePending(children: ReactNode) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [children]);

  return {
    pending,
    captureProps: {
      onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        const anchor = target.closest("a");
        if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
        const next = adminHref(anchor.getAttribute("href") ?? "", window.location.origin);
        if (!next) return;
        if (next === `${pathname}${window.location.search}`) return;
        setPending(true);
      },
      onSubmitCapture: (event: FormEvent<HTMLDivElement>) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        const method = (form.getAttribute("method") || "get").toLowerCase();
        if (method !== "get") return;
        const action = form.getAttribute("action") || pathname;
        const url = new URL(action, window.location.origin);
        const next = adminHref(`${url.pathname}${url.search}`, window.location.origin);
        if (!next) return;
        event.preventDefault();
        const params = new URLSearchParams();
        new FormData(form).forEach((value, key) => {
          if (typeof value === "string" && value) params.set(key, value);
        });
        const query = params.toString();
        setPending(true);
        router.push(`${url.pathname}${query ? `?${query}` : ""}`);
      },
    },
  };
}
