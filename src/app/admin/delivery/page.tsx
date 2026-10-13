import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { getStorefrontConfig, updateSetting } from "@/server/store/settings";
import { query } from "@/server/db/pool";
import { listAllShippingRates, setShippingRateActive } from "@/server/shipping/service";
import { formatGhs } from "@/lib/money";
import { revalidatePath } from "next/cache";
import {
  adminButton,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusPill,
} from "@/components/admin/ui";

async function saveFulfillment(formData: FormData) {
  "use server";
  await requirePermission("settings.write");
  await updateSetting("fulfillment", {
    coverage: formData.get("coverage") === "nationwide" ? "nationwide" : "accra",
    collectionEnabled: formData.get("collectionEnabled") === "on",
    deliveryEnabled: formData.get("deliveryEnabled") === "on",
    coverageNote: String(formData.get("coverageNote") ?? ""),
  });
  revalidatePath("/admin/delivery");
  revalidatePath("/checkout");
}

async function addRate(formData: FormData) {
  "use server";
  await requirePermission("settings.write");
  const zone = await query<{ id: string }>(
    `INSERT INTO shipping_zones (name, region_match, is_active) VALUES ($1, $2, TRUE) RETURNING id`,
    [String(formData.get("zoneName")), String(formData.get("regionMatch") ?? "")],
  );
  await query(`INSERT INTO shipping_rates (zone_id, name, amount, is_active) VALUES ($1, $2, $3, TRUE)`, [
    zone.rows[0].id,
    String(formData.get("rateName")),
    Number(formData.get("amount")),
  ]);
  revalidatePath("/admin/delivery");
}

async function toggleRate(formData: FormData) {
  "use server";
  await requirePermission("settings.write");
  await setShippingRateActive(String(formData.get("rateId")), formData.get("active") === "true");
  revalidatePath("/admin/delivery");
}

export default async function DeliveryPage() {
  await requirePermission("settings.write");
  const [config, rates] = await Promise.all([getStorefrontConfig(), listAllShippingRates()]);
  const { fulfillment } = config;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Delivery"
        description="Checkout does not add a delivery fee. Quote on WhatsApp, then move the ticket: Order Received → Packaging order → Order Out for Delivery → Order Delivered. Collection uses Ready at the shop → Collected."
      />

      <form action={saveFulfillment} className="max-w-xl space-y-4 rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Coverage</h2>
        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium">Where we send</legend>
          <label className="flex gap-2">
            <input type="radio" name="coverage" value="accra" defaultChecked={fulfillment.coverage === "accra"} />
            Accra only
          </label>
          <label className="flex gap-2">
            <input
              type="radio"
              name="coverage"
              value="nationwide"
              defaultChecked={fulfillment.coverage === "nationwide"}
            />
            Nationwide (add a rate per region below)
          </label>
        </fieldset>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="collectionEnabled" defaultChecked={fulfillment.collectionEnabled} />
          Store pickup / collection
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="deliveryEnabled" defaultChecked={fulfillment.deliveryEnabled} />
          Offer delivery (quoted on WhatsApp, not charged at checkout)
        </label>
        <label className="block text-sm">
          Note shown at checkout
          <textarea name="coverageNote" defaultValue={fulfillment.coverageNote} rows={3} className="input mt-1" />
        </label>
        <button className={adminButton("w-fit")} type="submit">
          Save coverage
        </button>
      </form>

      <section>
        <h2 className="font-serif text-xl">Rates</h2>
        <p className="mt-1 text-sm text-muted">
          Optional internal rates. Customer checkout does not charge them — delivery is confirmed on WhatsApp.
        </p>
        {rates.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No delivery rates"
              body="Checkout still offers delivery when coverage is enabled; the charge is confirmed on WhatsApp."
            />
          </div>
        ) : (
          <AdminTable className="mt-4">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{rate.zoneName}</span>
                    {rate.regionMatch ? (
                      <span className="block text-xs text-muted">Match: {rate.regionMatch}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{rate.name}</td>
                  <td className="px-4 py-3 tabular-nums">{formatGhs(Number(rate.amount))}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      value={rate.isActive && rate.zoneActive ? "Active" : "Off"}
                      tone={rate.isActive && rate.zoneActive ? "ok" : "muted"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleRate}>
                      <input type="hidden" name="rateId" value={rate.id} />
                      <input type="hidden" name="active" value={rate.isActive ? "false" : "true"} />
                      <button type="submit" className="text-sm text-accent">
                        {rate.isActive ? "Turn off" : "Turn on"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </section>

      <form action={addRate} className="max-w-xl space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Add a rate</h2>
        <label className="block text-sm">
          Zone name
          <input name="zoneName" required placeholder="Accra" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Region match (optional)
          <input name="regionMatch" placeholder="Greater Accra" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Rate name
          <input name="rateName" required placeholder="Standard delivery" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Amount (GHS)
          <input name="amount" type="number" step="0.01" min="0" required className="input mt-1" />
        </label>
        <button className={adminButton("w-fit")} type="submit">
          Add rate
        </button>
      </form>

      <p className="text-sm text-muted">
        Packing, shipped, delivered, ready for collection, and collected are set on each{" "}
        <Link href="/admin/orders" className="text-accent">
          order
        </Link>
        .
      </p>
    </div>
  );
}
