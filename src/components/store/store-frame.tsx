"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { setCartDrawerOpen } from "@/components/store/cart-store";

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
  useEffect(() => {
    setCartDrawerOpen(false);
  }, [path]);
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
