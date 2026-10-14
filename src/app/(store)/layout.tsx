import { Suspense } from "react";
import { CookieBanner } from "@/components/store/cookie-banner";
import { StoreFooter } from "@/components/store/footer";
import { StoreChrome } from "@/components/store/store-chrome";
import { StoreFrame } from "@/components/store/store-frame";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { CartDrawer } from "@/components/store/cart-drawer";
import { PromoPopup } from "@/components/store/promo-popup";
import { Toasts } from "@/components/store/toasts";
import { StoreChromeSkeleton } from "@/components/ui/skeleton";
import { listCategories, searchProducts } from "@/server/catalog/queries";
import { readStoreCustomer } from "@/server/customers/session";
import { getStorefrontConfig } from "@/server/store/settings";

export const dynamic = "force-dynamic";

async function StoreShell({ children }: { children: React.ReactNode }) {
  const [config, customer, categories, catalogue, promo] = await Promise.all([
    getStorefrontConfig(),
    readStoreCustomer(),
    listCategories(),
    searchProducts({ pageSize: 16 }),
    searchProducts({ onSale: true, pageSize: 8 }),
  ]);
  const categoryLinks = categories.filter((c) => !c.parentId).map((c) => ({ slug: c.slug, name: c.name }));
  const searchHints = [
    ...categoryLinks.map((c) => ({ slug: c.slug, name: c.name, href: `/shop/${c.slug}`, kind: "category" as const })),
    ...catalogue.items.map((p) => ({
      slug: p.slug,
      name: p.name,
      href: `/products/${p.slug}`,
      kind: "product" as const,
    })),
  ];
  return (
    <StoreFrame
      announcement={
        <>
          {config.announcement.enabled && config.announcement.text ? (
            <p className="line-clamp-2 bg-accent px-4 py-2 text-center text-[11px] uppercase leading-snug tracking-[0.14em] text-white sm:line-clamp-none sm:text-xs">
              {config.announcement.text}
            </p>
          ) : null}
          {promo.total > 0 ? (
            <a
              href="/promo"
              className="block bg-foreground px-4 py-2 text-center text-[11px] uppercase leading-snug tracking-[0.14em] text-white sm:text-xs"
            >
              <span className="sm:hidden">
                Promo — {promo.total} reduced GHS {promo.total === 1 ? "price" : "prices"}
              </span>
              <span className="hidden sm:inline">
                Promo and discounted — {promo.total} {promo.total === 1 ? "piece has" : "pieces have"} a reduced Ghana
                Cedi price.
              </span>
            </a>
          ) : null}
        </>
      }
      chrome={<StoreChrome signedIn={Boolean(customer)} categories={categoryLinks} searchHints={searchHints} />}
      footer={<StoreFooter contact={config.contact} social={config.social} />}
      extras={
        <>
          <WhatsAppButton phoneE164={config.contact.whatsappE164} />
          <PromoPopup products={promo.items} />
          <CartDrawer />
          <CookieBanner />
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
    <div className="flex min-h-full flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <Suspense fallback={<StoreShellFallback>{children}</StoreShellFallback>}>
        <StoreShell>{children}</StoreShell>
      </Suspense>
      <Toasts />
    </div>
  );
}
