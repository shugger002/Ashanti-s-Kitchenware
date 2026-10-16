import { requirePermission } from "@/server/auth/authorize";
import { listAdminProducts } from "@/server/catalog/queries";
import { setProductSalePrice } from "@/server/catalog/admin";
import { formatGhs, parseMoney } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { adminButton, AdminPageHeader, AdminTable, EmptyState, MobileCards } from "@/components/admin/ui";

async function applyDiscount(formData: FormData) {
  "use server";
  const user = await requirePermission("products.write");
  const productId = String(formData.get("productId"));
  const price = parseMoney(String(formData.get("price") ?? "0"));
  const raw = String(formData.get("discountPercent") ?? "").trim();
  if (formData.get("clear") === "1" || raw === "" || raw === "0") {
    await setProductSalePrice(productId, null, user.id);
  } else {
    const percent = Number(raw);
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return;
    const salePrice = parseMoney(price * (1 - percent / 100));
    await setProductSalePrice(productId, salePrice, user.id);
  }
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/promo");
}

function discountPercent(price: string, salePrice: string | null) {
  if (!salePrice) return "";
  const p = Number(price);
  const s = Number(salePrice);
  if (!(p > 0) || !(s < p)) return "";
  return String(Math.round((1 - s / p) * 100));
}

export default async function PromotionsPage() {
  const [, items] = await Promise.all([
    requirePermission("products.write"),
    listAdminProducts(),
  ]);

  return (
    <div>
      <AdminPageHeader title="Discounts" description="Knock a percent off one piece. That is a sale price in Cedis, not a coupon code." />
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No products yet" body="Add a product first, then you can put it on sale." />
        </div>
      ) : (
        <>
        <MobileCards className="mt-6">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-white/95 p-4 shadow-sm">
              <p className="font-medium">{p.name}</p>
              <p className="mt-0.5 text-xs uppercase text-muted">{p.categoryName ?? "-"}</p>
              <p className="mt-2 tabular-nums">{formatGhs(Number(p.price))}</p>
              <form action={applyDiscount} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="productId" value={p.id} />
                <input type="hidden" name="price" value={p.price} />
                <label className="block text-sm">
                  Discount %
                  <input
                    name="discountPercent"
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    defaultValue={discountPercent(p.price, p.salePrice)}
                    aria-label={`Discount percent for ${p.name}`}
                    className="input mt-1"
                  />
                </label>
                <button className={adminButton()} type="submit">
                  Apply
                </button>
                {p.salePrice ? (
                  <button name="clear" value="1" className="inline-flex h-12 items-center justify-center text-sm text-muted" type="submit">
                    Clear
                  </button>
                ) : null}
              </form>
            </li>
          ))}
        </MobileCards>
        <AdminTable className="mt-6">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">S/N</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Discount %</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, index) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 tabular-nums text-muted">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 uppercase text-muted">{p.categoryName ?? "-"}</td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(p.price))}</td>
                <td className="px-4 py-3">
                  <form id={`discount-${p.id}`} action={applyDiscount}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="price" value={p.price} />
                    <input
                      name="discountPercent"
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      defaultValue={discountPercent(p.price, p.salePrice)}
                      aria-label={`Discount percent for ${p.name}`}
                      className="input w-20"
                    />
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button form={`discount-${p.id}`} className={adminButton("px-3 py-2")} type="submit">
                      Apply
                    </button>
                    {p.salePrice ? (
                      <button form={`discount-${p.id}`} name="clear" value="1" className="inline-flex min-h-11 items-center text-sm text-muted" type="submit">
                        Clear
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        </>
      )}
    </div>
  );
}
