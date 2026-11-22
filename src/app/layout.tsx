import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Figtree, Newsreader } from "next/font/google";
import { brand } from "@/config/brand";
import { getAppUrl } from "@/server/env";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#c8102e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Kitchenware in Ghana`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Ashanti's Kitchenware sells kitchen appliances in Accra, priced in Ghana Cedis. Collect from the Dansoman-Sakaman shop.",
  metadataBase: new URL(getAppUrl()),
  openGraph: {
    siteName: brand.name,
    locale: "en_GH",
    type: "website",
    images: [{ url: "/demo/hero.jpg", alt: "Kitchen utensils hung on a wall and arranged on a counter" }],
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/app-192.png", sizes: "192x192" },
      { url: "/icons/app-512.png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GH"
      data-scroll-behavior="auto"
      suppressHydrationWarning
      className={`${figtree.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {/* THESIS: Accra kitchen-appliance shop. OWN-WORLD: cream paper, lacquer red CTAs. FIRST VIEWPORT: photograph, then a shop CTA. */}
        <Script id="ak-theme" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("ak_theme")==="dark"){document.documentElement.classList.add("dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#1b1714")}}catch(e){}
window.__akDeferredPrompt=null;
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__akDeferredPrompt=e;});`}
        </Script>
        <Script id="ak-sw" strategy="lazyOnload">
          {`if("serviceWorker" in navigator && location.pathname.indexOf("/admin")!==0){navigator.serviceWorker.register("/sw.js").catch(function(){})}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
