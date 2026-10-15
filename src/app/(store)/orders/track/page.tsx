import { headers } from "next/headers";
import { pageMeta } from "@/lib/seo";
import { findOrdersForTracking } from "@/server/orders/service";
import { getStorefrontConfig } from "@/server/store/settings";
import { buttonClass } from "@/components/ui/button";
import { OrderTracker } from "@/components/store/order-tracker";
import { clientIp } from "@/server/http/client-ip";

export const metadata = pageMeta({
  title: "Track order",
  description: "See where your Ashanti's Kitchenware order is.",
  path: "/orders/track",
});

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ref?: string; phone?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || [params.ref, params.phone].filter(Boolean).join(" ")).trim();
  const ip = clientIp(await headers());
  const [lookup, config] = await Promise.all([
    q ? findOrdersForTracking(q, ip) : Promise.resolve({ orders: [], error: undefined as string | undefined }),
    getStorefrontConfig(),
  ]);
  const found = lookup.orders;
  const digits = config.contact.whatsappE164.replace(/\D/g, "");
  const whatsappHref = digits ? `https://wa.me/${digits}` : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-24 lg:px-8 lg:py-12">
      <h1 className="text-3xl md:text-4xl">Track order</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Phone number from checkout, or your order number (AK-…).
      </p>
      <form className="mt-8 space-y-4" method="get">
        <label className="block text-sm">
          Phone or order number
          <input
            name="q"
            defaultValue={q}
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="020… or AK-…"
            className="input mt-1"
          />
        </label>
        <button className={buttonClass("primary", "h-12 w-full sm:w-auto")} type="submit">
          See my order
        </button>
      </form>
      {lookup.error ? <p className="mt-6 text-sm text-accent">{lookup.error}</p> : null}
      {q && !lookup.error && found.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No order for that phone or number.</p>
      ) : null}
      {found.map(({ order, items }) => (
        <OrderTracker key={order.id} order={order} items={items} whatsappHref={whatsappHref} />
      ))}
    </div>
  );
}
