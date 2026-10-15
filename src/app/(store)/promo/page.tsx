import Link from "next/link";
import { PromoDiscountedSection } from "@/components/store/promo-section";
import { pageMeta } from "@/lib/seo";
import { searchProducts } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Promo and discounted",
  description:
    "Kitchen appliances currently on promo or discounted at Ashanti's Kitchenware in Accra. Prices in Ghana Cedis.",
  path: "/promo",
});

export default async function PromoPage() {
  const { items } = await searchProducts({ onSale: true, pageSize: 48 });
  return (
    <div>
      <nav className="mx-auto max-w-6xl px-5 pt-8 text-sm text-muted lg:px-8">
        <Link href="/">Home</Link> / <span>Promo and discounted</span>
      </nav>
      <PromoDiscountedSection products={items} variant="page" />
    </div>
  );
}
