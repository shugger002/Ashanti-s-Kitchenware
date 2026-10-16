import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Figtree, Newsreader } from "next/font/google";
import { brand } from "@/config/brand";
import { CartProvider } from "@/components/store/cart-provider";
import { getAppUrl } from "@/server/env";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#c8102e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Kitchenware in Ghana`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Kitchen appliances from the Accra shop, priced in Ghana Cedis.",
  metadataBase: new URL(getAppUrl()),
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GH"
      suppressHydrationWarning
      className={`${figtree.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {/* THESIS: Accra kitchen-appliance shop. OWN-WORLD: cream paper, lacquer red CTAs. FIRST VIEWPORT: photograph, then a shop CTA. */}
        <Script id="ak-theme" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("ak_theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`}
        </Script>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
