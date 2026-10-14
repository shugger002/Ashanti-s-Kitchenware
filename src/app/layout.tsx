import type { Metadata } from "next";
import Script from "next/script";
import { Figtree, Newsreader } from "next/font/google";
import { brand } from "@/config/brand";
import { CartProvider } from "@/components/store/cart-provider";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Kitchenware in Ghana`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Kitchenware retailer in Accra selling cookware, appliances, and household essentials online.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GH"
      suppressHydrationWarning
      className={`${figtree.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {/* THESIS: Accra kitchen shop. OWN-WORLD: cream paper, lacquer red CTAs, GIR-like product-first layout. STORY: tools for daily cooking in Ghana Cedis. FIRST VIEWPORT: photograph, then a shop CTA. */}
        <Script id="ak-theme" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("ak_theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`}
        </Script>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
