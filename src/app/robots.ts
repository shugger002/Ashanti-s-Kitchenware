import type { MetadataRoute } from "next";
import { getAppUrl } from "@/server/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/account"],
      },
    ],
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
