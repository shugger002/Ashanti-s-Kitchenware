import { requirePermission } from "@/server/auth/authorize";
import { listCustomers } from "@/server/reporting/service";
import { formatGhs } from "@/lib/money";
import { ghanaInternationalMsisdn } from "@/lib/phone-gh";
import { AdminPageHeader, AdminTable, EmptyState, MobileCards } from "@/components/admin/ui";

export default async function CustomersPage() {
  await requirePermission("customers.read");
  const customers = await listCustomers();
  return (
    <div>
      <AdminPageHeader title="Customers" description="People who ordered or created an account." />
      {customers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No customers yet"
            body="People appear here after they place an order or create an account."
          />
        </div>
      ) : (
        <>
        <MobileCards>
          {customers.map((c) => {
            const digits = ghanaInternationalMsisdn(String(c.phone ?? ""));
            return (
              <li key={c.id} className="admin-panel p-4">
                <p className="font-medium">{c.full_name}</p>
                {digits.length >= 11 ? (
                  <a href={`tel:+${digits}`} className="mt-2 block min-h-11 text-accent">
                    {c.phone}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-muted">{c.phone}</p>
                )}
                {c.email ? (
                  <a href={`mailto:${c.email}`} className="block min-h-11 text-sm text-muted">
                    {c.email}
                  </a>
                ) : null}
                <p className="mt-2 text-sm tabular-nums">
                  {c.order_count} orders · {formatGhs(Number(c.paid_total))}
                </p>
              </li>
            );
          })}
        </MobileCards>
        <AdminTable className="mt-6">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3 font-medium">{c.full_name}</td>
                <td className="px-4 py-3">
                  {ghanaInternationalMsisdn(String(c.phone ?? "")).length >= 11 ? (
                    <a href={`tel:+${ghanaInternationalMsisdn(String(c.phone ?? ""))}`} className="text-accent">
                      {c.phone}
                    </a>
                  ) : (
                    c.phone
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="text-muted">
                      {c.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{c.order_count}</td>
                <td className="px-4 py-3 tabular-nums">{formatGhs(Number(c.paid_total))}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        </>
      )}
    </div>
  );
}
