import { shopMap } from "@/config/brand";
import { buttonClass } from "@/components/ui/button";
import { jsonLdText, pageMeta } from "@/lib/seo";
import { getStorefrontConfig } from "@/server/store/settings";

export const metadata = pageMeta({
  title: "Get directions",
  description: "Directions to Ashanti's Kitchenware on Alui Mahama Street, Sakaman, Accra.",
  path: "/directions",
});

export default async function DirectionsPage() {
  const { contact } = await getStorefrontConfig();
  const mapsUrl = contact.mapsUrl || shopMap.url;
  const digits = contact.whatsappE164.replace(/[^\d]/g, "");
  const locality = [contact.addressLine1, contact.city, contact.region, contact.country]
    .filter(Boolean)
    .join(", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: contact.tradingName || contact.legalName,
    telephone: contact.phoneE164,
    email: contact.email,
    url: mapsUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.addressLine1,
      addressLocality: contact.city,
      addressRegion: contact.region,
      addressCountry: contact.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: shopMap.lat,
      longitude: shopMap.lng,
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(jsonLd) }} />
      <h1 className="text-4xl">Get directions</h1>
      <section className="mt-8 space-y-6" aria-labelledby="shop-location">
        <h2 id="shop-location" className="sr-only">
          Shop location
        </h2>
        <p className="max-w-prose leading-relaxed text-muted">
          The shop is at {locality}. That is the address on the shop’s Google listing. Google Maps opens in a new
          window and uses Google’s terms.
        </p>
        <p className="leading-relaxed">
          {contact.addressLine1 ? (
            <>
              {contact.addressLine1}
              <br />
            </>
          ) : null}
          {[contact.city, contact.region, contact.country].filter(Boolean).join(", ")}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={shopMap.directionsUrl}
            rel="noreferrer"
            target="_blank"
            className={buttonClass("primary")}
          >
            Get directions in Google Maps
          </a>
          <a href={mapsUrl} rel="noreferrer" target="_blank" className={buttonClass("secondary")}>
            Open in Google Maps
          </a>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          If you cannot find the shop, call{" "}
          <a href={`tel:${contact.phoneE164}`} className="text-accent">
            {contact.phoneDisplay}
          </a>{" "}
          or{" "}
          <a href={`https://wa.me/${digits}`} className="text-accent">
            WhatsApp
          </a>
          .
        </p>
      </section>
    </div>
  );
}
