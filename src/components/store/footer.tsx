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

function SocialIcon({ name }: { name: string }) {
  const className = "size-4 fill-current";
  if (name === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  }
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    );
  }
  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (name === "X") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (name === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564z" />
      </svg>
    );
  }
  return null;
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
    ["TikTok", social.tiktok],
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
              <a
                key={label}
                href={href}
                rel="noreferrer"
                target="_blank"
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-sm text-white/80 hover:text-white"
              >
                <SocialIcon name={label} />
              </a>
            ))}
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-4 text-[11px] leading-relaxed text-white/45 lg:px-8 lg:pb-5">{DEMO_PHOTO_NOTICE}</p>
      </div>
    </footer>
  );
}
