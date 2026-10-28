import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { countCustomerGlance, listCustomers, type CustomerNeedFilter } from "@/server/customers/service";
import { CustomerListCard, CustomerTableRow } from "@/components/admin/customer-list-card";
import { adminButton, AdminGlance, AdminPageHeader, AdminTable, EmptyState, MobileCards, Toolbar } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatGhs } from "@/lib/money";

function parseNeed(value?: string): CustomerNeedFilter | "" {
  return value === "work" || value === "new" || value === "account" || value === "all" ? value : "";
}

function listHref(opts: { q?: string; need?: string }) {
  const params = new URLSearchParams();
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.need) params.set("need", opts.need);
  const query = params.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; need?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const searching = Boolean(q?.trim());
  const needParam = parseNeed(params.need);
  const need: CustomerNeedFilter | undefined = needParam || (searching ? undefined : "work");
  const [, people, glance] = await Promise.all([
    requirePermission("customers.read"),
    listCustomers({ q, need }),
    countCustomerGlance(),
  ]);
  const filtered = Boolean(searching || needParam);
  const workNowActive = need === "work" && !searching;
  const chips: { href: string; label: string; active: boolean }[] = [
    { href: listHref({ q, need: "work" }), label: "Work now", active: workNowActive },
    { href: listHref({ q, need: "new" }), label: "New today", active: need === "new" },
    { href: listHref({ q, need: "account" }), label: "Accounts", active: need === "account" },
    { href: listHref({ q, need: "all" }), label: "Everyone", active: need === "all" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Work now is people with an unfinished order. Call or WhatsApp from the card. Delivery is still quoted on WhatsApp."
      />
      <AdminGlance
        items={[
          { href: "/admin/customers", label: "Work now", value: glance.work, warn: glance.work > 0 },
          { href: "/admin/customers?need=new", label: "New today", value: glance.newToday, warn: glance.newToday > 0 },
          { href: "/admin/customers?need=all", label: "People", value: glance.people },
          { href: "/admin/orders", label: "Paid to the shop", value: formatGhs(Number(glance.paidTotal)) },
        ]}
      />
      <Toolbar>
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" method="get">
          <label htmlFor="customer-q" className="sr-only">
            Search customers
          </label>
          <input
            id="customer-q"
            name="q"
            defaultValue={params.q}
            placeholder="Name, phone, or email"
            className="input w-full sm:max-w-sm"
          />
          <button className={adminButton()} type="submit">
            Search
          </button>
          {filtered ? (
            <Link href="/admin/customers" className="inline-flex h-12 items-center text-sm text-muted hover:text-foreground">
              Clear
            </Link>
          ) : null}
        </form>
      </Toolbar>
      <div className="mt-3 flex flex-wrap gap-2">
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
      {people.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={filtered ? "No matching people" : "No customers yet"}
            body={
              filtered
                ? "Clear a filter or try another name, phone, or email."
                : "People appear here after they place an order or create an account."
            }
          />
        </div>
      ) : (
        <>
          <MobileCards>
            {people.map((person) => (
              <li key={person.id}>
                <CustomerListCard person={person} />
              </li>
            ))}
          </MobileCards>
          <AdminTable className="mt-4">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Last order</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Person</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <CustomerTableRow key={person.id} person={person} />
              ))}
            </tbody>
          </AdminTable>
        </>
      )}
    </div>
  );
}
