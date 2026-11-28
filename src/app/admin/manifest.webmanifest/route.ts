import { NextResponse } from "next/server";
import { brand } from "@/config/brand";

export function GET() {
  return NextResponse.json(
    {
      name: `${brand.name} Desk`,
      short_name: "AK Desk",
      description: "Orders, stock, and payments for the Accra shop.",
      id: "/admin",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#c8102e",
      lang: "en-GH",
      icons: [
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
        { src: "/icons/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
