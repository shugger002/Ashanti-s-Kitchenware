"use client";

import { useEffect } from "react";
import { hydrateViewed, rememberViewed } from "@/components/store/recently-viewed-store";

export function TrackViewed({ slug, name, imageUrl }: { slug: string; name: string; imageUrl: string | null }) {
  useEffect(() => {
    hydrateViewed();
    rememberViewed({ slug, name, imageUrl });
  }, [slug, name, imageUrl]);
  return null;
}
