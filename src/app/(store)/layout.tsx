import { Suspense } from "react";
import { CartProvider } from "@/components/store/cart-provider";
import { StoreFooter } from "@/components/store/footer";
import { StoreChrome } from "@/components/store/store-chrome";
import { StoreFrame } from "@/components/store/store-frame";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { CartDrawer } from "@/components/store/cart-drawer";
import { DeferredStoreExtras } from "@/components/store/deferred-store-extras";
import { Toasts } from "@/components/store/toasts";
import { WishlistHydrator } from "@/components/store/wishlist-button";
import { StoreChromeSkeleton } from "@/components/ui/skeleton";
import { countDemoListings, countOnSaleProducts, listCategories } from "@/server/catalog/queries";
import { getStorefrontConfig } from "@/server/store/settings";
import { getOperationsConfig } from "@/server/ops/settings";
import { AnalyticsTracker } from "@/components/store/analytics-tracker";
import { getAnalyticsMeasurementId } from "@/server/env";

export const revalidate = 60;

async function StoreShell({ children }: { children: React.ReactNode }) {
  const [config, categories, promoCount, demoCount, ops] = await Promise.all([
    getStorefrontConfig(),
    listCategories(),
    countOnSaleProducts(),
    countDemoListings(),
    getOperationsConfig(),
  ]);
  const demoAnnouncement = config.announcement.text.toLowerCase().includes("demo photograph");
  const categoryLinks = categories.filter((c) => !c.parentId).map((c) => ({ slug: c.slug, name: c.name }));
  const searchHints = categoryLinks.map((c) => ({
    slug: c.slug,
    name: c.name,
    href: `/shop/${c.slug}`,
    kind: "category" as const,
  }));
  return (
    <StoreFrame
      announcement={
        <>
          {ops.checkoutPaused ? (
            <p className="bg-foreground px-3 py-2 text-center text-[11px] leading-snug text-white sm:px-4 sm:text-xs">
              {ops.maintenanceMessage}
            </p>
          ) : null}
          {config.announcement.enabled && config.announcement.text && !(demoAnnouncement && demoCount === 0) ? (
            <p className="line-clamp-1 bg-accent px-3 py-1.5 text-center text-[10px] uppercase leading-snug tracking-[0.12em] text-white sm:line-clamp-none sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
              {config.announcement.text}
            </p>
          ) : null}
          {promoCount > 0 ? (
            <a
              href="/promo"
              className="block bg-foreground px-3 py-1.5 text-center text-[10px] uppercase leading-snug tracking-[0.12em] text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]"
            >
              <span className="sm:hidden">
                Promo: {promoCount} reduced GHS {promoCount === 1 ? "price" : "prices"}
              </span>
              <span className="hidden sm:inline">
                Promo and discounted: {promoCount} {promoCount === 1 ? "piece has" : "pieces have"} a reduced Ghana
                Cedi price.
              </span>
            </a>
          ) : null}
        </>
      }
      chrome={<StoreChrome categories={categoryLinks} searchHints={searchHints} />}
      footer={<StoreFooter contact={config.contact} social={config.social} categories={categoryLinks} showDemoNotice={demoCount > 0} />}
      extras={
        <>
          <WhatsAppButton phoneE164={config.contact.whatsappE164} />
          <CartDrawer />
          <DeferredStoreExtras />
        </>
      }
    >
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </StoreFrame>
  );
}

function StoreShellFallback({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreChromeSkeleton />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
    <div className="flex min-h-full flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <WishlistHydrator />
      <Suspense fallback={<StoreShellFallback>{children}</StoreShellFallback>}>
        <StoreShell>{children}</StoreShell>
      </Suspense>
      <Toasts />
      <AnalyticsTracker measurementId={getAnalyticsMeasurementId()} />
    </div>
    </CartProvider>
  );
}
