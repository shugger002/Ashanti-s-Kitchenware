"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function StoreFrame({
  announcement,
  chrome,
  children,
  footer,
  extras,
}: {
  announcement: ReactNode;
  chrome: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  extras: ReactNode;
}) {
  const path = usePathname();
  if (path.startsWith("/checkout")) {
    return <>{children}</>;
  }
  return (
    <>
      {announcement}
      {chrome}
      {children}
      {footer}
      {extras}
    </>
  );
}
