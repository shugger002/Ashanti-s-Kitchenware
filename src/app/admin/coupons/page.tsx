import { requirePermission } from "@/server/auth/authorize";
import { createCoupon, listCoupons, setCouponActive } from "@/server/coupons/service";
import { formatGhs } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { adminButton, AdminPageHeader, AdminTable, EmptyState, StatusPill } from "@/components/admin/ui";

async function addCoupon(formData: FormData) {
  "use server";
  const user = await requirePermission("products.write");
  const type = String(formData.get("discountType")) === "fixed" ? "fixed" : "percent";
  const maxRaw = String(formData.get("maxDiscount") ?? "").trim();
  const usesRaw = String(formData.get("maxUses") ?? "").trim();
  await createCoupon(
    {
      code: String(formData.get("code") ?? ""),
      description: String(formData.get("description") ?? ""),
      discountType: type,
      discountValue: Number(formData.get("discountValue")),
      maxDiscount: maxRaw ? Number(maxRaw) : null,
      minSpend: Number(formData.get("minSpend") ?? 0),
      maxUses: usesRaw ? Number(usesRaw) : null,
    },
    user.id,
  );
  revalidatePath("/admin/coupons");
}

async function toggleCoupon(formData: FormData) {
  "use server";
  const user = await requirePermission("products.write");
  await setCouponActive(String(formData.get("id")), formData.get("active") === "1", user.id);
  revalidatePath("/admin/coupons");
}

export default async function CouponsPage() {
  await requirePermission("products.write");
  const coupons = await listCoupons();
  const active = coupons.filter((c) => c.is_active).length;
  const uses = coupons.reduce((sum, c) => sum + c.uses, 0);

  return (
    <div>
      <AdminPageHeader
        title="Promo & Coupon Management"
        description="Create and monitor checkout codes. Delivery is still quoted on WhatsApp — these codes do not invent free shipping."
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        <li className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Total Coupons</p>
          <p className="mt-2 text-3xl font-medium tabular-nums">{coupons.length}</p>
        </li>
        <li className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Active Campaigns</p>
          <p className="mt-2 text-3xl font-medium tabular-nums">{active}</p>
        </li>
        <li className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Total Usages</p>
          <p className="mt-2 text-3xl font-medium tabular-nums">{uses}</p>
        </li>
      </ul>

      {coupons.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No coupons yet" body="Add a percent or Ghana Cedi off the basket. Do not create a shipping coupon — delivery stays on WhatsApp." />
        </div>
      ) : (
        <AdminTable className="mt-6">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Coupon Code</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Min Spend</th>
              <th className="px-4 py-3 font-medium">Uses</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.code}</td>
                <td className="px-4 py-3 text-sm text-muted">{c.description || "—"}</td>
                <td className="px-4 py-3 text-sm">
                  {c.discount_type === "percent" ? `${c.discount_value}%` : formatGhs(Number(c.discount_value))}
                  {c.max_discount ? <span className="mt-1 block text-xs text-muted">Max: {formatGhs(Number(c.max_discount))}</span> : null}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(c.min_spend))}</td>
                <td className="px-4 py-3 text-sm">
                  {c.uses} ({c.max_uses == null ? "unlimited" : c.max_uses})
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={c.is_active ? "Active" : "Off"} tone={c.is_active ? "ok" : "muted"} />
                </td>
                <td className="px-4 py-3">
                  <form action={toggleCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={c.is_active ? "0" : "1"} />
                    <button type="submit" className="text-sm text-muted hover:text-foreground">
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      <form action={addCoupon} className="mt-8 max-w-xl space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-medium">Create Coupon</h2>
        <label className="block text-sm">
          Code
          <input name="code" required minLength={3} className="input mt-1" placeholder="WELCOME10" />
        </label>
        <label className="block text-sm">
          Description
          <input name="description" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Type
          <select name="discountType" className="input mt-1">
            <option value="percent">Percent off basket</option>
            <option value="fixed">Ghana Cedi off basket</option>
          </select>
        </label>
        <label className="block text-sm">
          Value
          <input name="discountValue" type="number" step="0.01" min="0.01" required className="input mt-1" />
        </label>
        <label className="block text-sm">
          Max discount (GHS, optional for percent)
          <input name="maxDiscount" type="number" step="0.01" min="0" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Minimum spend (GHS)
          <input name="minSpend" type="number" step="0.01" min="0" defaultValue="0" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Max uses (blank = unlimited)
          <input name="maxUses" type="number" min="1" className="input mt-1" />
        </label>
        <button className={adminButton()} type="submit">
          Create Coupon
        </button>
      </form>
    </div>
  );
}
