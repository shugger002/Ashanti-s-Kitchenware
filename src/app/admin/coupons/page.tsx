import { requirePermission } from "@/server/auth/authorize";
import { createCoupon, listCoupons, setCouponActive } from "@/server/coupons/service";
import { formatGhs } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { adminButton, AdminGlance, AdminPageHeader, AdminSection, AdminTable, EmptyState, MobileCards, StatusPill } from "@/components/admin/ui";

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
  const [, coupons] = await Promise.all([requirePermission("products.write"), listCoupons()]);
  const active = coupons.filter((c) => c.is_active).length;
  const uses = coupons.reduce((sum, c) => sum + c.uses, 0);

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Checkout codes that take money off the basket. They do not make delivery free. Delivery stays on WhatsApp."
      />

      <AdminGlance
        items={[
          { label: "Coupons", value: coupons.length },
          { label: "Turned on", value: active },
          { label: "Times used", value: uses },
        ]}
      />

      {coupons.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No coupons yet"
            body="Add a percent or Cedis off the basket. Do not make a free-delivery code. Delivery stays on WhatsApp."
          />
        </div>
      ) : (
        <>
        <MobileCards className="mt-6">
          {coupons.map((c) => (
            <li key={c.id} className="admin-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{c.code}</p>
                <StatusPill value={c.is_active ? "On" : "Off"} tone={c.is_active ? "ok" : "muted"} />
              </div>
              {c.description ? <p className="mt-1 text-sm text-muted">{c.description}</p> : null}
              <p className="mt-2 text-sm">
                {c.discount_type === "percent" ? `${c.discount_value}%` : formatGhs(Number(c.discount_value))}
                {c.max_discount ? ` · max ${formatGhs(Number(c.max_discount))}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted">
                Min {formatGhs(Number(c.min_spend))} · {c.uses} uses
                {c.max_uses == null ? "" : ` / ${c.max_uses}`}
              </p>
              <form action={toggleCoupon} className="mt-3">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="active" value={c.is_active ? "0" : "1"} />
                <button type="submit" className={adminButton()}>
                  {c.is_active ? "Turn off" : "Turn on"}
                </button>
              </form>
            </li>
          ))}
        </MobileCards>
        <AdminTable className="mt-6">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Off</th>
              <th className="px-4 py-3 font-medium">Min basket</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">On or off</th>
              <th className="px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.code}</td>
                <td className="px-4 py-3 text-sm text-muted">{c.description || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  {c.discount_type === "percent" ? `${c.discount_value}%` : formatGhs(Number(c.discount_value))}
                  {c.max_discount ? <span className="mt-1 block text-xs text-muted">Max: {formatGhs(Number(c.max_discount))}</span> : null}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(c.min_spend))}</td>
                <td className="px-4 py-3 text-sm">
                  {c.uses} ({c.max_uses == null ? "unlimited" : c.max_uses})
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={c.is_active ? "On" : "Off"} tone={c.is_active ? "ok" : "muted"} />
                </td>
                <td className="px-4 py-3">
                  <form action={toggleCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={c.is_active ? "0" : "1"} />
                    <button type="submit" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground">
                      {c.is_active ? "Turn off" : "Turn on"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        </>
      )}

      <form action={addCoupon} className="mt-8 max-w-xl">
        <AdminSection title="New coupon" hint="A percent or Cedis off the basket. Delivery stays on WhatsApp.">
        <div className="space-y-3">
        <label className="block text-sm">
          Code customers type
          <input name="code" required minLength={3} className="input mt-1" placeholder="WELCOME10" />
        </label>
        <label className="block text-sm">
          Note for you
          <input name="description" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Kind of discount
          <select name="discountType" className="input mt-1">
            <option value="percent">Percent off the basket</option>
            <option value="fixed">Cedis off the basket</option>
          </select>
        </label>
        <label className="block text-sm">
          How much off
          <input name="discountValue" type="number" step="0.01" min="0.01" required className="input mt-1" />
        </label>
        <label className="block text-sm">
          Cap in Cedis (optional)
          <input name="maxDiscount" type="number" step="0.01" min="0" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Customer must spend at least (GH₵)
          <input name="minSpend" type="number" step="0.01" min="0" defaultValue="0" className="input mt-1" />
        </label>
        <label className="block text-sm">
          How many times it can be used
          <span className="mt-0.5 block text-xs text-muted">Leave blank for no limit.</span>
          <input name="maxUses" type="number" min="1" className="input mt-1" />
        </label>
        <button className={adminButton()} type="submit">
          Save coupon
        </button>
        </div>
        </AdminSection>
      </form>
    </div>
  );
}
