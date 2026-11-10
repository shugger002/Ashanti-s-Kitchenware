"use client";

import { useEffect, useState } from "react";
import { StoreHeader } from "@/components/store/header";
import { MobileDock } from "@/components/store/mobile-dock";
import { SearchOverlay, type SearchHint } from "@/components/store/search-overlay";

type CategoryLink = { slug: string; name: string };

export function StoreChrome({
  categories,
  searchHints,
}: {
  categories: CategoryLink[];
  searchHints: SearchHint[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/store/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { signedIn: false }))
      .then((data: { signedIn?: boolean }) => {
        if (!ignore) setSignedIn(Boolean(data.signedIn));
      })
      .catch(() => {
        if (!ignore) setSignedIn(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <StoreHeader
        signedIn={signedIn}
        categories={categories}
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
        onSearch={() => setSearchOpen(true)}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} hints={searchHints} />
      {menuOpen || searchOpen ? null : <MobileDock signedIn={signedIn} />}
    </>
  );
}
