import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { adjustStock, listInventory } from "@/server/inventory/service";
import { revalidatePath } from "next/cache";
import { adminButton, AdminPageHeader, AdminTable, EmptyState, StatusPill } from "@/components/admin/ui";
import { InventoryCsvForm } from "@/app/admin/inventory/csv-form";
import { cn } from "@/lib/utils";

async function adjust(formData: FormData) {
  "use server";
  const user = await requirePermission("inventory.write");
  await adjustStock({
    inventoryId: String(formData.get("inventoryId")),
    deltaOnHand: Number(formData.get("delta")),
    reason: String(formData.get("reason") ?? "Adjustment"),
    notes: String(formData.get("notes") ?? ""),
    actorUserId: user.id,
  });
  revalidatePath("/admin/inventory");
}

async function restock(formData: FormData) {
  "use server";
  const user = await requirePermission("inventory.write");
  const qty = Math.max(0, Number(formData.get("qty")));
  if (qty <= 0) return;
  await adjustStock({
    inventoryId: String(formData.get("inventoryId")),
    deltaOnHand: qty,
    reason: "Restock",
    notes: String(formData.get("notes") ?? ""),
    actorUserId: user.id,
    source: "restock",
  });
  revalidatePath("/admin/inventory");
}

export default async function InventoryPage() {
  const [, rows] = await Promise.all([requirePermission("inventory.write"), listInventory()]);
  const out = rows.filter((row) => row.available <= 0).length;
  const low = rows.filter((row) => row.available > 0 && row.available <= row.lowStockThreshold).length;
  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Upload a CSV to restock many SKUs at once, or add pieces one row at a time. Available is on hand minus reserved."
      />
      <div className="mt-6">
        <InventoryCsvForm />
      </div>
      {rows.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          <li className="rounded-2xl border border-border bg-background px-4 py-3">
            <p className="text-xs text-muted">SKUs</p>
            <p className="mt-1 font-serif text-2xl tabular-nums">{rows.length}</p>
          </li>
          <li className={`rounded-2xl border bg-background px-4 py-3 ${low > 0 ? "border-accent" : "border-border"}`}>
            <p className="text-xs text-muted">Low stock</p>
            <p className={`mt-1 font-serif text-2xl tabular-nums ${low > 0 ? "text-accent" : ""}`}>{low}</p>
          </li>
          <li className={`rounded-2xl border bg-background px-4 py-3 ${out > 0 ? "border-accent" : "border-border"}`}>
            <p className="text-xs text-muted">Out of stock</p>
            <p className={`mt-1 font-serif text-2xl tabular-nums ${out > 0 ? "text-accent" : ""}`}>{out}</p>
          </li>
        </ul>
      ) : null}
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing to count"
            body="Inventory rows appear when products are created. Add a product first."
            action={
              <Link href="/admin/products/new" className={adminButton()}>
                New product
              </Link>
            }
          />
        </div>
      ) : (
        <AdminTable className="mt-4">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">On hand</th>
              <th className="px-4 py-3 font-medium">Reserved</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium">Restock</th>
              <th className="px-4 py-3 font-medium">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const outOfStock = row.available <= 0;
              const tight = outOfStock || row.available <= row.lowStockThreshold;
              return (
                <tr
                  key={row.id}
                  className={cn("border-b border-border last:border-0 align-top", tight ? "bg-accent/5" : "hover:bg-surface")}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${row.productId}`} className="flex items-start gap-3">
                      {row.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.imageUrl}
                          alt={row.imageAlt || row.productName}
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-[10px] text-muted">
                          No photo
                        </span>
                      )}
                      <span>
                        <span className="font-medium">{row.productName}</span>
                        {row.variantName ? <span className="mt-0.5 block text-xs text-muted">{row.variantName}</span> : null}
                        {tight ? (
                          <span className="mt-1 inline-block">
                            <StatusPill value={outOfStock ? "Out" : "Low"} tone="attention" />
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.sku}</td>
                  <td className="px-4 py-3 tabular-nums">{row.onHand}</td>
                  <td className="px-4 py-3 tabular-nums">{row.reserved}</td>
                  <td className={cn("px-4 py-3 tabular-nums", tight && "font-medium text-accent")}>{row.available}</td>
                  <td className="px-4 py-3">
                    <form action={restock} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="inventoryId" value={row.id} />
                      <input
                        name="qty"
                        type="number"
                        min={1}
                        required
                        placeholder="Qty"
                        aria-label={`Restock ${row.productName}`}
                        className="input w-20"
                      />
                      <button className={adminButton("px-3 py-2")} type="submit">
                        Restock
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={adjust} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="inventoryId" value={row.id} />
                      <input
                        name="delta"
                        type="number"
                        required
                        placeholder="+/-"
                        aria-label={`Adjust ${row.productName}`}
                        className="input w-20"
                      />
                      <input
                        name="reason"
                        required
                        placeholder="Reason"
                        aria-label={`Reason for ${row.productName}`}
                        className="input min-w-40 flex-1"
                      />
                      <button className={adminButton("px-3 py-2")} type="submit">
                        Apply
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
