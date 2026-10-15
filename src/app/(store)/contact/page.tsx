import { ContactForm } from "@/components/store/contact-form";
import { shopMap } from "@/config/brand";
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
    <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <h1 className="text-4xl">Contact</h1>
      <div className="mt-8 space-y-3 leading-relaxed">
        <p>
          <a href={`tel:${contact.phoneE164}`}>{contact.phoneDisplay}</a>
        </p>
        <p>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </p>
        <p className="text-muted">
          {contact.addressLine1 ? (
            <>
              {contact.addressLine1}
              <br />
            </>
          ) : null}
          {[contact.city, contact.region, contact.country].filter(Boolean).join(", ")}
        </p>
        <p>
          <a href={`https://wa.me/${digits}`}>WhatsApp</a>
        </p>
        <p className="text-sm">
          <a href={mapsUrl} rel="noreferrer" className="text-accent">
            Open the shop in Google Maps
          </a>
          . That link leaves this site and uses Google’s own terms.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
