import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { searchProducts } from "@/server/catalog/queries";
import { setProductSalePrice } from "@/server/catalog/admin";
import { formatGhs } from "@/lib/money";
import { revalidatePath } from "next/cache";
import {
  adminButton,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusPill,
} from "@/components/admin/ui";

async function saveSale(formData: FormData) {
  "use server";
  const user = await requirePermission("products.write");
  const raw = String(formData.get("salePrice") ?? "").trim();
  const parsed = formData.get("clear") === "1" || raw === "" ? null : Number(raw);
  const salePrice = parsed == null || !Number.isFinite(parsed) ? null : parsed;
  await setProductSalePrice(String(formData.get("productId")), salePrice, user.id);
  revalidatePath("/admin/promotions");
  revalidatePath("/");
  revalidatePath("/promo");
}

export default async function PromotionsPage() {
  await requirePermission("products.write");
  const { items } = await searchProducts({ includeInactive: true, pageSize: 48 });
  const onPromo = items.filter((p) => p.salePrice);
  const rest = items.filter((p) => !p.salePrice);

  return (
    <div>
      <AdminPageHeader
        title="Promotions"
        description="A sale price below the regular Ghana Cedi amount lists the piece on /promo and in the storefront popup (about once a minute). Leave sale price blank to end a discount. Do not invent a store-wide percentage off."
        action={
          <Link href="/promo" className="text-sm text-accent">
            View store promo
          </Link>
        }
      />

      {onPromo.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No current discounts"
            body="Set a sale price on a listed product below. Do not invent a store-wide percentage off."
          />
        </div>
      ) : (
        <AdminTable className="mt-6">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">On promo</th>
              <th className="px-4 py-3 font-medium">Regular</th>
              <th className="px-4 py-3 font-medium">Sale</th>
              <th className="px-4 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {onPromo.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium">
                    {p.name}
                  </Link>
                  <span className="mt-1 block">
                    <StatusPill value="Promo" tone="attention" />
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(p.price))}</td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(p.salePrice))}</td>
                <td className="px-4 py-3">
                  <form action={saveSale} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="productId" value={p.id} />
                    <input
                      name="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={p.salePrice ?? ""}
                      aria-label={`Sale price for ${p.name}`}
                      className="input w-28"
                    />
                    <button className={adminButton("px-3 py-2")} type="submit">
                      Save
                    </button>
                    <button name="clear" value="1" className="text-sm text-muted" type="submit">
                      Clear
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      <h2 className="mt-10 font-serif text-xl">Put a piece on promo</h2>
      {rest.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Every listed product already has a sale price, or the catalogue is empty.</p>
      ) : (
        <AdminTable className="mt-4">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Regular</th>
              <th className="px-4 py-3 font-medium">Sale price (GHS)</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium">
                    {p.name}
                  </Link>
                  <span className="block text-xs text-muted">{p.sku}</span>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(p.price))}</td>
                <td className="px-4 py-3">
                  <form action={saveSale} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="productId" value={p.id} />
                    <input
                      name="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      aria-label={`Sale price for ${p.name}`}
                      className="input w-28"
                    />
                    <button className={adminButton("px-3 py-2")} type="submit">
                      Discount
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
