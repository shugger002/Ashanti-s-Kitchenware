import type { Metadata } from "next";
import { brand, defaultContact, shopMap } from "@/config/brand";
import { getAppUrl } from "@/server/env";

const SHARE_IMAGE = "/demo/hero.jpg";

/** Safe to put inside <script type="application/ld+json">. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("http://")) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getAppUrl()}${path}`;
}

export function pageMeta(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  index?: boolean;
}): Metadata {
  const url = `${getAppUrl()}${input.path}`;
  const pageTitle = input.title.replace(` | ${brand.name}`, "").trim();
  const fullTitle = `${pageTitle} | ${brand.name}`;
  const image = input.image?.trim() || SHARE_IMAGE;
  const listed = input.index !== false;
  return {
    title: pageTitle,
    description: input.description,
    alternates: { canonical: url },
    robots: listed ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url,
      siteName: brand.name,
      locale: "en_GH",
      type: "website",
      images: [{ url: image, alt: pageTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [image],
    },
  };
}

/** Home page facts that match the shop: name, Accra address, hours, and search. */
export function shopGraph() {
  const url = getAppUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: brand.name,
        url,
        logo: absoluteUrl("/logo.png"),
        email: defaultContact.email,
        telephone: defaultContact.phoneE164,
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: brand.name,
        inLanguage: "en-GH",
        publisher: { "@id": `${url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${url}/products?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Store",
        "@id": `${url}/#store`,
        name: brand.name,
        url,
        image: absoluteUrl(SHARE_IMAGE),
        telephone: defaultContact.phoneE164,
        email: defaultContact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: defaultContact.addressLine1,
          addressLocality: defaultContact.city,
          addressRegion: defaultContact.region,
          addressCountry: "GH",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: shopMap.lat,
          longitude: shopMap.lng,
        },
        hasMap: shopMap.url,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "07:00",
          closes: "19:00",
        },
        parentOrganization: { "@id": `${url}/#organization` },
      },
    ],
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
