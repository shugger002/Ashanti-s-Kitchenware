"use client";

import { useState } from "react";
import { StoreHeader } from "@/components/store/header";
import { MobileDock } from "@/components/store/mobile-dock";
import { SearchOverlay, type SearchHint } from "@/components/store/search-overlay";

type CategoryLink = { slug: string; name: string };

export function StoreChrome({
  signedIn,
  categories,
  searchHints,
}: {
  signedIn: boolean;
  categories: CategoryLink[];
  searchHints: SearchHint[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      {menuOpen || searchOpen ? null : <MobileDock onSearch={() => setSearchOpen(true)} />}
    </>
  );
}
