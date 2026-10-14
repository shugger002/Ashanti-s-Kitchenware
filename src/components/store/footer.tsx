import Link from "next/link";
import { brand } from "@/config/brand";
import { StoreLogo } from "@/components/store/logo";
import { DEMO_PHOTO_NOTICE } from "@/content/demo-catalog";
import { CookieSettingsButton } from "@/components/store/cookie-banner";
import { NewsletterForm } from "@/components/store/newsletter-form";
import type { ContactSettings, SocialSettings } from "@/server/store/settings";

export function StoreFooter({
  contact,
  social,
}: {
  contact: ContactSettings;
  social: SocialSettings;
}) {
  const socialLinks = [
    ["Instagram", social.instagram],
    ["Facebook", social.facebook],
    ["X", social.twitter],
    ["LinkedIn", social.linkedin],
  ].filter(([, href]) => Boolean(href)) as [string, string][];

  return (
    <footer className="mt-auto border-t border-border bg-surface pb-[calc(var(--store-dock)+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-4 lg:px-8">
        <div>
          <StoreLogo className="h-12 w-auto max-w-[14rem]" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Kitchenware retailer in Accra. We sell cookware, appliances, and household essentials in Ghana Cedis.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">{DEMO_PHOTO_NOTICE}</p>
        </div>
        <div className="text-sm leading-7">
          <p className="font-medium">Shop</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/products">All products</Link>
            </li>
            <li>
              <Link href="/promo">Promo and discounted</Link>
            </li>
            <li>
              <Link href="/shop/kitchen-appliances">Kitchen Appliances</Link>
            </li>
            <li>
              <Link href="/shop/cookware">Cookware</Link>
            </li>
            <li>
              <Link href="/shop/storage-insulation">Insulation & Food Storage</Link>
            </li>
            <li>
              <Link href="/shop/home-essentials">Home Essentials</Link>
            </li>
            <li>
              <Link href="/shop/tableware">Tableware</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm leading-7">
          <p className="font-medium">Customer care</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/orders/track">Track an order</Link>
            </li>
            <li>
              <Link href="/refunds">Shipping and returns</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">Kitchen notes</p>
          <p className="mt-3 leading-relaxed text-muted">Recipes, care tips, and new stock. No invented discount.</p>
          <NewsletterForm compact />
          <p className="mt-3 font-medium">Contact</p>
          <p className="mt-2 text-muted">
            <a href={`tel:${contact.phoneE164}`}>{contact.phoneDisplay}</a>
            <br />
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <br />
            {contact.addressLine1}
            <br />
            {[contact.city, contact.country].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-muted lg:px-8">
          <p>
            © {new Date().getFullYear()} {brand.name} · Accra, Ghana
          </p>
          <nav className="flex flex-wrap gap-4" aria-label="Policies">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <CookieSettingsButton />
            {socialLinks.map(([label, href]) => (
              <a key={label} href={href} rel="noreferrer">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
