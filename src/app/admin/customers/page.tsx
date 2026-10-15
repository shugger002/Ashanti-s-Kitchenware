import { requirePermission } from "@/server/auth/authorize";
import { listCustomers } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { AdminPageHeader, AdminTable, EmptyState } from "@/components/admin/ui";

export default async function CustomersPage() {
  await requirePermission("customers.read");
  const customers = await listCustomers();
  return (
    <div>
      <AdminPageHeader title="Customers" description="People who have placed an order or created an account." />
      {customers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No customers yet"
            body="People appear here after they place an order or create an account."
          />
        </div>
      ) : (
        <AdminTable className="mt-6">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Paid total</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3 font-medium">{c.full_name}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c.email ?? "-"}</td>
                <td className="px-4 py-3 tabular-nums">{c.order_count}</td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(c.paid_total))}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
