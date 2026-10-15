import { ContactForm } from "@/components/store/contact-form";
import { shopMap } from "@/config/brand";
import { buttonClass } from "@/components/ui/button";
import { pageMeta } from "@/lib/seo";
import { getStorefrontConfig } from "@/server/store/settings";

export const metadata = pageMeta({
  title: "Contact",
  description: "Contact Ashanti's Kitchenware in Accra.",
  path: "/contact",
});

export default async function ContactPage() {
  const { contact } = await getStorefrontConfig();
  const digits = contact.whatsappE164.replace(/[^\d]/g, "");
  const mapsUrl = contact.mapsUrl || shopMap.url;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16">
      <h1 className="text-3xl md:text-4xl">Contact</h1>
      <div className="mt-8 space-y-4 leading-relaxed">
        <p className="text-muted">
          {contact.addressLine1 ? (
            <>
              {contact.addressLine1}
              <br />
            </>
          ) : null}
          {[contact.city, contact.region, contact.country].filter(Boolean).join(", ")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a href={`tel:${contact.phoneE164}`} className={buttonClass("primary", "h-12 w-full sm:w-auto")}>
            {contact.phoneDisplay}
          </a>
          <a href={`https://wa.me/${digits}`} className={buttonClass("secondary", "h-12 w-full sm:w-auto")}>
            WhatsApp
          </a>
          <a href={`mailto:${contact.email}`} className={buttonClass("secondary", "h-12 w-full sm:w-auto")}>
            Email
          </a>
        </div>
        <p className="text-sm">
          <a href="/directions" className="inline-flex min-h-11 items-center text-accent">
            Get directions
          </a>
          {" · "}
          <a href={mapsUrl} rel="noreferrer" className="inline-flex min-h-11 items-center text-accent">
            Open the shop in Google Maps
          </a>
          . Maps links leave this site and use Google’s own terms.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
