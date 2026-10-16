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
    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted lg:text-[11px]">{children}</p>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-9 items-center py-0.5 hover:text-accent lg:min-h-11">
      {children}
    </Link>
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
        <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8 lg:py-16">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent lg:text-[11px]">Visit the Accra shop</p>
          <p className="mt-2 max-w-3xl font-serif text-lg leading-snug text-pretty md:text-4xl lg:mt-3">
            {contact.addressLine1 || locality}
          </p>
          {contact.addressLine1 ? <p className="mt-1 text-xs text-muted lg:mt-2 lg:text-sm">{locality}</p> : null}
          <p className="mt-2 max-w-md text-pretty text-xs leading-relaxed text-muted lg:mt-4 lg:text-sm">{shopHours}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 lg:mt-6 lg:flex lg:flex-wrap lg:gap-3">
            <Link href="/directions" className={buttonClass("primary", "h-10 px-2 text-xs lg:h-12 lg:w-auto lg:px-5 lg:text-sm")}>
              Directions
            </Link>
            <a href={`https://wa.me/${digits}`} className={buttonClass("secondary", "h-10 px-2 text-xs lg:h-12 lg:w-auto lg:px-5 lg:text-sm")}>
              WhatsApp
            </a>
            <a href={`tel:${contact.phoneE164}`} className={buttonClass("secondary", "h-10 px-2 text-xs lg:h-12 lg:w-auto lg:px-5 lg:text-sm")}>
              Call
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-5 lg:grid-cols-4 lg:gap-12 lg:px-8 lg:py-14">
        <div className="col-span-2 lg:col-span-1">
          <StoreLogo className="h-8 w-auto max-w-[10rem] lg:h-12 lg:max-w-[14rem]" />
          <p className="mt-2 hidden max-w-xs text-pretty text-sm leading-relaxed text-muted lg:mt-4 lg:block">
            Kitchen appliances from the Accra shop, priced in Ghana Cedis.
          </p>
          <p className="mt-2 text-xs leading-relaxed lg:mt-4 lg:text-sm">
            <a className="hover:text-accent" href={`tel:${contact.phoneE164}`}>
              {contact.phoneDisplay}
            </a>
            <span className="text-muted"> · </span>
            <a className="hover:text-accent" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </p>
          <p className="mt-1 hidden lg:mt-3 lg:block">
            <a href={mapsUrl} rel="noreferrer" className="text-sm text-accent hover:text-accent-hover">
              Open in Google Maps
            </a>
          </p>
        </div>

        <nav aria-label="Shop" className="text-sm">
          <FooterHeading>Shop</FooterHeading>
          <ul className="mt-1.5 lg:mt-2">
            <li>
              <FooterLink href="/products">All products</FooterLink>
            </li>
            <li>
              <FooterLink href="/promo">Promo</FooterLink>
            </li>
            {shopLinks.map((item) => (
              <li key={item.href}>
                <FooterLink href={item.href}>{item.label}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help" className="text-sm">
          <FooterHeading>Help</FooterHeading>
          <ul className="mt-1.5 lg:mt-2">
            {helpLinks.map((item) => (
              <li key={item.href}>
                <FooterLink href={item.href}>{item.label}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 text-sm lg:col-span-1">
          <FooterHeading>Stock updates</FooterHeading>
          <p className="mt-2 hidden text-pretty leading-relaxed text-muted lg:mt-4 lg:block">
            Email when listed appliances restock. This is not a discount unless the shop publishes one.
          </p>
          <div className="mt-2 lg:mt-4">
            <NewsletterForm compact />
          </div>
        </div>
      </div>

      <div className="bg-foreground text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-xs lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:px-8 lg:py-5">
          <p>
            © {new Date().getFullYear()} {contact.legalName || brand.name} · Accra, Ghana
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Policies">
            <Link href="/privacy" className="inline-flex min-h-9 items-center hover:text-white lg:min-h-11">
              Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-9 items-center hover:text-white lg:min-h-11">
              Terms
            </Link>
            <Link href="/cookies" className="inline-flex min-h-9 items-center hover:text-white lg:min-h-11">
              Cookies
            </Link>
            <CookieSettingsButton className="inline-flex min-h-9 items-center text-xs text-white/70 hover:text-white" />
            {socialLinks.map(([label, href]) => (
              <a key={label} href={href} rel="noreferrer" className="hover:text-white">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-4 text-[11px] leading-relaxed text-white/45 lg:px-8 lg:pb-5">{DEMO_PHOTO_NOTICE}</p>
      </div>
    </footer>
  );
}
