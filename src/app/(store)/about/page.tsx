import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { pageMeta } from "@/lib/seo";
import { getStorefrontConfig } from "@/server/store/settings";

export const metadata = pageMeta({
  title: "About",
  description: "Ashanti's Kitchenware sells kitchen appliances in Accra, priced in Ghana Cedis.",
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
          <h1 className="text-4xl text-white md:text-5xl">Kitchen appliances from the Accra shop.</h1>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <p className="max-w-prose text-lg leading-relaxed text-muted">
          Ashanti's Kitchenware is a kitchen-appliance retailer in Accra taking orders online. We are not a luxury
          house and we are not a discount warehouse. The work is simpler: sell appliances that are on the shelf,
          photograph them, and price them in Ghana Cedis.
        </p>
        <p className="mt-6 max-w-prose leading-relaxed text-muted">
          The range is blenders, cookers, kettles, fryers, and related kitchen appliances, with pots, tableware, and
          household pieces sold alongside when they are in stock. This site is a product catalogue, not a food column.
        </p>
        <h2 className="mt-14 text-2xl">Specifications</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          Wattage, piece count, litre mark, and plug type are named on the listing when staff have confirmed them. If a
          demo product is on this site, treat those fields as layout until they are checked against stock.
        </p>
        <h2 className="mt-14 text-2xl">Quality we will stand behind</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          If an item arrives faulty, damaged, or incorrect, you have seven days to ask for a return. We do not invent
          star ratings or a founder myth. Reviews appear only after the shop accepts them, and they are not independently
          verified purchases.
        </p>
        <h2 className="mt-14 text-2xl">Buy what you need</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          Add the next appliance you will use, not a boxed set you will never unpack. Specs and care notes sit on the
          product page.
        </p>
        <h2 className="mt-14 text-2xl">The shop</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-muted">
          Call {contact.phoneDisplay} or email {contact.email} for the shop address before travelling. Online prices are
          in Ghana Cedis. Collection and delivery are agreed with the shop.
        </p>
        <Link href="/shop" className={`${buttonClass("primary")} mt-10`}>
          Shop appliances
        </Link>
      </div>
    </div>
  );
}
