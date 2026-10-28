import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { listCoupons } from "@/server/coupons/service";
import { formatGhs } from "@/lib/money";
import { addCouponAction, toggleCouponAction, updateCouponAction } from "@/app/admin/coupons/actions";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  EmptyState,
  MobileCards,
  StatusPill,
} from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function offLabel(c: { discount_type: string; discount_value: string; max_discount: string | null }) {
  const amount = c.discount_type === "percent" ? `${c.discount_value}% off` : `${formatGhs(Number(c.discount_value))} off`;
  return c.max_discount ? `${amount} · cap ${formatGhs(Number(c.max_discount))}` : amount;
}

function CouponFields({
  c,
}: {
  c?: {
    discount_type: string;
    discount_value: string;
    max_discount: string | null;
    min_spend: string;
    max_uses: number | null;
    description: string;
  };
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Note for you
        <input name="description" defaultValue={c?.description} className="input mt-1" />
      </label>
      <label className="block text-sm">
        Kind of discount
        <select name="discountType" defaultValue={c?.discount_type ?? "percent"} className="input mt-1">
          <option value="percent">Percent off the basket</option>
          <option value="fixed">Cedis off the basket</option>
        </select>
      </label>
      <label className="block text-sm">
        How much off
        <input
          name="discountValue"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={c?.discount_value}
          className="input mt-1"
        />
      </label>
      <label className="block text-sm">
        Cap in Cedis (optional)
        <input
          name="maxDiscount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={c?.max_discount ?? ""}
          className="input mt-1"
        />
      </label>
      <label className="block text-sm">
        Customer must spend at least (GH₵)
        <input name="minSpend" type="number" step="0.01" min="0" defaultValue={c?.min_spend ?? "0"} className="input mt-1" />
      </label>
      <label className="block text-sm">
        How many times it can be used
        <span className="mt-0.5 block text-xs text-muted">Leave blank for no limit.</span>
        <input name="maxUses" type="number" min="1" defaultValue={c?.max_uses ?? ""} className="input mt-1" />
      </label>
    </div>
  );
}

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; on?: string }>;
}) {
  const params = await searchParams;
  const [, coupons] = await Promise.all([requirePermission("products.write"), listCoupons()]);
  const onFilter = params.on === "1" || params.on === "0" ? params.on : "";
  const active = coupons.filter((c) => c.is_active).length;
  const uses = coupons.reduce((sum, c) => sum + c.uses, 0);
  const displayed = onFilter === "1" ? coupons.filter((c) => c.is_active) : onFilter === "0" ? coupons.filter((c) => !c.is_active) : coupons;
  const next = onFilter ? `/admin/coupons?on=${onFilter}` : "/admin/coupons";

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Checkout codes that take money off the basket. They do not make delivery free. Delivery stays on WhatsApp."
        action={
          <Link href="/admin/promotions" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
            Discounts
          </Link>
        }
      />
      <p className="mt-4 max-w-xl text-sm text-muted">
        Sale prices on one piece live on{" "}
        <Link href="/admin/promotions" className="text-accent">
          Discounts
        </Link>
        .
      </p>

      <AdminGlance
        items={[
          { href: "/admin/coupons", label: "Coupons", value: coupons.length },
          { href: "/admin/coupons?on=1", label: "Turned on", value: active },
          { href: "/admin/coupons?on=0", label: "Turned off", value: coupons.length - active },
          { label: "Times used", value: uses },
        ]}
      />

      <form action={addCouponAction} className="mt-8 max-w-xl">
        <AdminSection title="New coupon" hint="A percent or Cedis off the basket. Delivery stays on WhatsApp.">
          {params.error === "code" ? (
            <p className="mb-4 border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent" role="alert">
              That code is already on the desk. Use a different one.
            </p>
          ) : null}
          <div className="space-y-3">
            <label className="block text-sm">
              Code customers type
              <input name="code" required minLength={3} className="input mt-1" placeholder="WELCOME10" />
            </label>
            <CouponFields />
            <button className={adminButton()} type="submit">
              Save coupon
            </button>
          </div>
        </AdminSection>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { href: "/admin/coupons", label: "All", active: !onFilter },
          { href: "/admin/coupons?on=1", label: "Turned on", active: onFilter === "1" },
          { href: "/admin/coupons?on=0", label: "Turned off", active: onFilter === "0" },
        ].map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              buttonClass("ghost", "h-10 min-h-10 px-3 text-sm"),
              chip.active && "bg-foreground text-background hover:bg-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      {coupons.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No coupons yet"
            body="Add a percent or Cedis off the basket. Do not make a free-delivery code. Delivery stays on WhatsApp."
          />
        </div>
      ) : displayed.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing in this filter" body="Turn a code on, or show all coupons." />
        </div>
      ) : (
        <>
          <MobileCards className="mt-6">
            {displayed.map((c) => (
              <li key={c.id} className="admin-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{c.code}</p>
                  <StatusPill value={c.is_active ? "On" : "Off"} tone={c.is_active ? "ok" : "muted"} />
                </div>
                {c.description ? <p className="mt-1 text-sm text-muted">{c.description}</p> : null}
                <p className="mt-2 text-sm">{offLabel(c)}</p>
                <p className="mt-1 text-xs text-muted">
                  Min {formatGhs(Number(c.min_spend))} · {c.uses} uses
                  {c.max_uses == null ? "" : ` / ${c.max_uses}`}
                </p>
                <form action={toggleCouponAction} className="mt-3">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="active" value={c.is_active ? "0" : "1"} />
                  <input type="hidden" name="next" value={next} />
                  <button type="submit" className={adminButton()}>
                    {c.is_active ? "Turn off" : "Turn on"}
                  </button>
                </form>
                <form action={updateCouponAction} className="mt-4 border-t border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] pt-4">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="next" value={next} />
                  <CouponFields c={c} />
                  <button className={`${adminButton()} mt-3`} type="submit">
                    Save changes
                  </button>
                </form>
              </li>
            ))}
          </MobileCards>
          <AdminTable className="mt-6">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Off</th>
                <th className="px-4 py-3 font-medium">Min basket</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">On or off</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.code}</p>
                    {c.description ? <p className="mt-1 text-xs text-muted">{c.description}</p> : null}
                    <form action={updateCouponAction} className="mt-3 max-w-xs space-y-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="next" value={next} />
                      <CouponFields c={c} />
                      <button className={adminButton("px-4")} type="submit">
                        Save changes
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-sm">{offLabel(c)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatGhs(Number(c.min_spend))}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.uses}
                    {c.max_uses == null ? "" : ` / ${c.max_uses}`}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={c.is_active ? "On" : "Off"} tone={c.is_active ? "ok" : "muted"} />
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={c.is_active ? "0" : "1"} />
                      <input type="hidden" name="next" value={next} />
                      <button type="submit" className={adminButton("px-4")}>
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
    </div>
  );
}
