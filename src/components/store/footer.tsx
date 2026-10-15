import type { ReactNode } from "react";
import Link from "next/link";
import { brand, shopHours, shopMap } from "@/config/brand";
import { StoreLogo } from "@/components/store/logo";
import { DEMO_PHOTO_NOTICE } from "@/content/demo-catalog";
import { CookieSettingsButton } from "@/components/store/cookie-banner";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { buttonClass } from "@/components/ui/button";
import type { ContactSettings, SocialSettings } from "@/server/store/settings";

type CategoryLink = { slug: string; name: string };

const fallbackShop = [
  { href: "/shop/kitchen-appliances", label: "Kitchen Appliances" },
  { href: "/shop/cookware", label: "Cookware" },
  { href: "/shop/storage-insulation", label: "Insulation & Food Storage" },
  { href: "/shop/home-essentials", label: "Home Essentials" },
  { href: "/shop/tableware", label: "Tableware" },
];

const helpLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/directions", label: "Get directions" },
  { href: "/faq", label: "FAQ" },
  { href: "/faq#payments", label: "Payments" },
  { href: "/orders/track", label: "Track an order" },
  { href: "/refunds", label: "Shipping and returns" },
  { href: "/about", label: "About" },
  { href: "/journal", label: "Guides" },
];

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{children}</p>
  );
}

export function StoreFooter({
  contact,
  social,
  categories = [],
}: {
  contact: ContactSettings;
  social: SocialSettings;
  categories?: CategoryLink[];
}) {
  const socialLinks = [
    ["Instagram", social.instagram],
    ["Facebook", social.facebook],
    ["X", social.twitter],
    ["LinkedIn", social.linkedin],
  ].filter(([, href]) => Boolean(href)) as [string, string][];
  const mapsUrl = contact.mapsUrl || shopMap.url;
  const digits = contact.whatsappE164.replace(/[^\d]/g, "");
  const shopLinks =
    categories.length > 0
      ? categories.map((category) => ({ href: `/shop/${category.slug}`, label: category.name }))
      : fallbackShop;
  const locality = [contact.city, contact.country].filter(Boolean).join(", ");

  return (
    <footer className="mt-auto bg-surface pb-[calc(var(--store-dock)+env(safe-area-inset-bottom))] lg:pb-0">
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.45fr_1fr] lg:items-end lg:px-8 lg:py-16">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">Visit the Accra shop</p>
            <p className="mt-3 font-serif text-3xl text-pretty md:text-4xl">{contact.addressLine1 || locality}</p>
            {contact.addressLine1 ? <p className="mt-2 text-sm text-muted">{locality}</p> : null}
            <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted">{shopHours}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/directions" className={buttonClass("primary")}>
              Get directions
            </Link>
            <a href={`https://wa.me/${digits}`} className={buttonClass("secondary")}>
              WhatsApp
            </a>
            <a href={`tel:${contact.phoneE164}`} className={buttonClass("secondary")}>
              Call
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:px-8">
        <div>
          <StoreLogo className="h-12 w-auto max-w-[14rem]" />
          <p className="mt-4 max-w-xs text-pretty text-sm leading-relaxed text-muted">
            Kitchen appliances from the Accra shop, priced in Ghana Cedis.
          </p>
          <p className="mt-4 text-sm leading-relaxed">
            <a className="hover:text-accent" href={`tel:${contact.phoneE164}`}>
              {contact.phoneDisplay}
            </a>
            <br />
            <a className="hover:text-accent" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </p>
          <p className="mt-3">
            <a href={mapsUrl} rel="noreferrer" className="text-sm text-accent hover:text-accent-hover">
              Open in Google Maps
            </a>
          </p>
        </div>

        <nav aria-label="Shop" className="text-sm leading-7">
          <FooterHeading>Shop</FooterHeading>
          <ul className="mt-4 space-y-1">
            <li>
              <Link href="/products" className="hover:text-accent">
                All products
              </Link>
            </li>
            <li>
              <Link href="/promo" className="hover:text-accent">
                Promo and discounted
              </Link>
            </li>
            {shopLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help" className="text-sm leading-7">
          <FooterHeading>Help</FooterHeading>
          <ul className="mt-4 space-y-1">
            {helpLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <FooterHeading>Stock updates</FooterHeading>
          <p className="mt-4 text-pretty leading-relaxed text-muted">
            Email when listed appliances restock. This is not a discount unless the shop publishes one.
          </p>
          <div className="mt-4">
            <NewsletterForm compact />
          </div>
        </div>
      </div>

      <div className="bg-foreground text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 text-xs lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} {contact.legalName || brand.name} · Accra, Ghana
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Policies">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-white">
              Cookies
            </Link>
            <CookieSettingsButton className="text-xs text-white/70 hover:text-white" />
            {socialLinks.map(([label, href]) => (
              <a key={label} href={href} rel="noreferrer" className="hover:text-white">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-5 text-[11px] leading-relaxed text-white/45 lg:px-8">{DEMO_PHOTO_NOTICE}</p>
      </div>
    </footer>
  );
}
