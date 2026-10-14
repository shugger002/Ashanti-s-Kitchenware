import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { getAppUrl } from "@/server/env";

/** Safe to put inside <script type="application/ld+json">. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function pageMeta(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${getAppUrl()}${input.path}`;
  const pageTitle = input.title.replace(` | ${brand.name}`, "").trim();
  const fullTitle = `${pageTitle} | ${brand.name}`;
  return {
    title: pageTitle,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url,
      siteName: brand.name,
      locale: "en_GH",
      type: "website",
    },
  };
}
