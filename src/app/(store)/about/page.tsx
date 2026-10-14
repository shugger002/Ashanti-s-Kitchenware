import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { pageMeta } from "@/lib/seo";
import { getStorefrontConfig } from "@/server/store/settings";

export const metadata = pageMeta({
  title: "About",
  description: "Ashanti's Kitchenware is an Accra kitchenware shop built around better everyday cooking.",
  path: "/about",
});

export default async function AboutPage() {
  const { contact } = await getStorefrontConfig();
  return (
    <div>
      <section className="relative min-h-[42dvh] overflow-hidden bg-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/demo/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="relative mx-auto flex min-h-[42dvh] max-w-3xl flex-col justify-end px-5 pb-12 lg:px-8">
          <h1 className="text-4xl text-white md:text-5xl">Cook more often, with tools that stay.</h1>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <p className="max-w-prose text-lg leading-relaxed text-muted">
          Ashanti's Kitchenware is a kitchenware retailer at Accra Mall taking orders online. We are not a luxury house
          and we are not a discount warehouse. The work is simpler: sell pieces you will use on a Tuesday night, keep
          them in good condition, and photograph what is actually on the shelf.
        </p>
        <p className="mt-6 max-w-prose leading-relaxed text-muted">
          Better everyday cooking is the point. A pot that heats evenly. A kettle you trust. A plate that still looks
          considered after a hundred washes. Practical beauty — not a slogan, a test: would you reach for it after a long
          day?
        </p>
        <h2 className="mt-14 text-2xl">Materials</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          Stainless, enamel, ceramic, and steel are named on the listing. If a demo product is on this site, treat
          wattage, piece count, and plug type as layout until staff confirm them against stock. We would rather a short
          specification than a paragraph that hides the metal.
        </p>
        <h2 className="mt-14 text-2xl">Quality we will stand behind</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          If an item arrives faulty, damaged, or incorrect, you have seven days to ask for a return. We do not invent
          star ratings or a founder myth. Reviews appear only after the shop accepts them, and they are not independently
          verified purchases.
        </p>
        <h2 className="mt-14 text-2xl">Less waste</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          Buy the next piece you need, not a boxed set you will never unpack. Care notes in the journal are there so wood,
          iron, and steel last. A tool that stays in the drawer for a decade is kinder than one that is replaced every
          season.
        </p>
        <h2 className="mt-14 text-2xl">The shop</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          The shop publishes this address: {contact.addressLine1}, {contact.city}. Call {contact.phoneDisplay} or email{" "}
          {contact.email} before travelling — Accra Mall’s public store directory does not currently list this shop by
          name. Online prices are in Ghana Cedis. Collection and delivery are agreed with the shop.
        </p>
        <Link href="/shop" className={`${buttonClass("primary")} mt-10`}>
          Shop the collection
        </Link>
      </div>
    </div>
  );
}
