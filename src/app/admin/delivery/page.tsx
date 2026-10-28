import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { getStorefrontConfig } from "@/server/store/settings";
import { listAllShippingRates } from "@/server/shipping/service";
import { countOrderGlance, listOrders } from "@/server/orders/service";
import { addStaffNoteAction, saveFulfillmentAction, toggleStaffNoteAction } from "@/app/admin/delivery/actions";
import { DeliveryWorkCard } from "@/components/admin/delivery-work-card";
import { formatGhs } from "@/lib/money";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  MobileCards,
  StatusPill,
} from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeliveryNeed = "work" | "send" | "notes";

function parseNeed(value?: string): DeliveryNeed {
  return value === "send" || value === "notes" || value === "work" ? value : "work";
}

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const need = parseNeed((await searchParams).need);
  const [, config, rates, glance, packing, out] = await Promise.all([
    requirePermission("settings.write"),
    getStorefrontConfig(),
    listAllShippingRates(),
    countOrderGlance(),
    need === "work" ? listOrders({ status: "packing" }) : Promise.resolve([]),
    need === "work" ? listOrders({ need: "out" }) : Promise.resolve([]),
  ]);
  const { fulfillment } = config;
  const live = [...packing, ...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const chips: { href: string; label: string; active: boolean }[] = [
    { href: "/admin/delivery", label: "Work now", active: need === "work" },
    { href: "/admin/delivery?need=send", label: "How we send", active: need === "send" },
    { href: "/admin/delivery?need=notes", label: "Staff notes", active: need === "notes" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Delivery"
        description="Do not charge delivery at checkout. Quote the fee on WhatsApp. Shop pickup is Ready at the shop, then Collected."
      />
      <AdminGlance
        items={[
          { href: "/admin/orders?need=out", label: "Out", value: glance.out, warn: glance.out > 0 },
          { href: "/admin/orders?status=packing", label: "Packing", value: glance.packing, warn: glance.packing > 0 },
          { href: "/admin/delivery?need=send", label: "Shop pickup", value: fulfillment.collectionEnabled ? "On" : "Off" },
          {
            href: "/admin/delivery?need=send",
            label: "Coverage",
            value: fulfillment.coverage === "nationwide" ? "Nationwide" : "Accra",
          },
        ]}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
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

      {need === "work" ? (
        live.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Nothing packing or out"
              body="Paid orders you start packing, send out, or mark ready at the shop show here."
            />
          </div>
        ) : (
          <>
            <MobileCards>
              {live.map((order) => (
                <li key={order.id}>
                  <DeliveryWorkCard order={order} />
                </li>
              ))}
            </MobileCards>
            <AdminTable className="mt-4">
              <thead>
                <tr className="border-b border-border bg-surface text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">How</th>
                  <th className="px-4 py-3 font-medium">Now</th>
                  <th className="px-4 py-3 font-medium">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {live.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{order.publicRef}</td>
                    <td className="px-4 py-3">
                      {order.fullName}
                      <span className="mt-0.5 block text-xs text-muted">{order.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.deliveryMethod === "collection" ? "Collection" : "Delivery"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={order.status} tone="attention" />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className={adminButton("h-11 min-h-11 px-4")}>
                        Open this order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </>
        )
      ) : null}

      {need === "send" ? (
        <form action={saveFulfillmentAction} className="mt-6 max-w-xl admin-panel space-y-4">
          <h2 className="font-serif text-xl">How we send</h2>
          <p className="text-sm text-muted">Customers are not charged these choices at checkout. You still quote on WhatsApp.</p>
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
              Nationwide — still quote on WhatsApp
            </label>
          </fieldset>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="collectionEnabled" defaultChecked={fulfillment.collectionEnabled} />
            Customers can collect at the shop
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="deliveryEnabled" defaultChecked={fulfillment.deliveryEnabled} />
            Offer delivery (price on WhatsApp, not at checkout)
          </label>
          <label className="block text-sm">
            Note customers see at checkout
            <textarea name="coverageNote" defaultValue={fulfillment.coverageNote} rows={3} className="input mt-1" />
          </label>
          <button className={adminButton()} type="submit">
            Save how we send
          </button>
        </form>
      ) : null}

      {need === "notes" ? (
        <div className="mt-6 space-y-8">
          <p className="max-w-xl text-sm text-muted">
            Staff reminder, not charged. The customer never pays this amount at checkout. Quote on WhatsApp.
          </p>
          {rates.length === 0 ? (
            <EmptyState
              title="No staff price notes"
              body="That is fine. Delivery is still offered, and you quote the charge on WhatsApp."
            />
          ) : (
            <>
              <MobileCards className="mt-0">
                {rates.map((rate) => (
                  <li key={rate.id} className="admin-panel space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{rate.zoneName}</p>
                        <p className="mt-0.5 text-sm">{rate.name}</p>
                        {rate.regionMatch ? <p className="text-xs text-muted">{rate.regionMatch}</p> : null}
                      </div>
                      <StatusPill
                        value={rate.isActive && rate.zoneActive ? "On" : "Off"}
                        tone={rate.isActive && rate.zoneActive ? "ok" : "muted"}
                      />
                    </div>
                    <p className="font-serif tabular-nums">{formatGhs(Number(rate.amount))}</p>
                    <p className="text-xs text-muted">Staff reminder, not charged</p>
                    <form action={toggleStaffNoteAction}>
                      <input type="hidden" name="rateId" value={rate.id} />
                      <input type="hidden" name="active" value={rate.isActive ? "false" : "true"} />
                      <button
                        type="submit"
                        className={rate.isActive ? buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto") : adminButton()}
                      >
                        {rate.isActive ? "Turn off" : "Turn on"}
                      </button>
                    </form>
                  </li>
                ))}
              </MobileCards>
              <AdminTable>
                <thead>
                  <tr className="border-b border-border bg-surface text-xs text-muted">
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Reminder</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-4 py-3">
                        <span className="font-medium">{rate.zoneName}</span>
                        {rate.regionMatch ? <span className="block text-xs text-muted">{rate.regionMatch}</span> : null}
                      </td>
                      <td className="px-4 py-3">{rate.name}</td>
                      <td className="px-4 py-3">
                        <span className="tabular-nums">{formatGhs(Number(rate.amount))}</span>
                        <span className="mt-0.5 block text-xs text-muted">Not charged</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill
                          value={rate.isActive && rate.zoneActive ? "On" : "Off"}
                          tone={rate.isActive && rate.zoneActive ? "ok" : "muted"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleStaffNoteAction}>
                          <input type="hidden" name="rateId" value={rate.id} />
                          <input type="hidden" name="active" value={rate.isActive ? "false" : "true"} />
                          <button type="submit" className={buttonClass("secondary", "h-11 min-h-11 px-4")}>
                            {rate.isActive ? "Turn off" : "Turn on"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </>
          )}
          <form action={addStaffNoteAction} className="max-w-xl admin-panel space-y-3">
            <h2 className="font-serif text-xl">Add a staff reminder</h2>
            <label className="block text-sm">
              Area
              <input name="zoneName" required placeholder="Accra" className="input mt-1" />
            </label>
            <label className="block text-sm">
              Region (optional)
              <input name="regionMatch" placeholder="Greater Accra" className="input mt-1" />
            </label>
            <label className="block text-sm">
              Name
              <input name="rateName" required placeholder="Usual Accra drop" className="input mt-1" />
            </label>
            <label className="block text-sm">
              Reminder amount (GH₵)
              <span className="mt-0.5 block text-xs text-muted">Not charged at checkout.</span>
              <input name="amount" type="number" step="0.01" min="0" required className="input mt-1" />
            </label>
            <button className={adminButton()} type="submit">
              Save note
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
