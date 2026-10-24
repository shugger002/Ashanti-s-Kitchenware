import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://api.moolre.com https://rmp.hubtel.com https://payproxyapi.hubtel.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://analytics.google.com ws: wss:",
      "form-action 'self' https://checkout.hubtel.com https://pay.hubtel.com",
      "frame-src 'self'",
      "child-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "xlsx", "pg", "argon2"],
  experimental: {
    agentUpgrade: "security",
    serverActions: {
      bodySizeLimit: "40mb",
      allowedOrigins: [
        "ashantis-kitchenware.vercel.app",
        "ashanti-s-kitchenware.vercel.app",
        "ashantis-kitchenware-shugger001s-projects.vercel.app",
        "*.vercel.app",
        "ashantiskitchenware.com",
        "www.ashantiskitchenware.com",
        "js-ashanti-web.onrender.com",
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/sw.js",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      { source: "/:path*", headers: securityHeaders },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/admin/products/template", destination: "/api/admin/products-template" },
        { source: "/admin/inventory/template", destination: "/api/admin/inventory-template" },
      ],
    };
  },
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/cookie-policy", destination: "/cookies", permanent: true },
      { source: "/refund-policy", destination: "/refunds", permanent: true },
      { source: "/track-order", destination: "/orders/track", permanent: true },
      { source: "/shop/cooking-ware", destination: "/shop/cookware", permanent: true },
      { source: "/shop/insulations", destination: "/shop/storage-insulation", permanent: true },
      { source: "/sale", destination: "/promo", permanent: true },
      { source: "/discounted", destination: "/promo", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
