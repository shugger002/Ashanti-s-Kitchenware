import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, PackageSearch, Store } from "lucide-react";
import { customerLogout } from "@/app/(store)/login/actions";
import { buttonClass } from "@/components/ui/button";
import { pageMeta } from "@/lib/seo";
import { formatGhs } from "@/lib/money";
import { readStoreCustomer } from "@/server/customers/session";
import { listOrdersForCustomer } from "@/server/orders/service";

export const metadata = pageMeta({
  title: "Your account",
  description: "Orders and details for your Ashanti's Kitchenware account.",
  path: "/account",
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return letters.toUpperCase() || "AK";
}

function labelStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AccountPage() {
  const customer = await readStoreCustomer();
  if (!customer) redirect("/login");
  const orders = await listOrdersForCustomer(customer.id);
  const phoneHref = `tel:${customer.phone.replace(/\s+/g, "")}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16">
      <p className="text-xs font-medium uppercase text-muted">Signed in</p>
      <h1 className="mt-2 text-3xl md:text-4xl">Your account</h1>
      <p className="mt-3 max-w-xl text-pretty text-sm text-muted">
        Saved orders stay with this email. Guest checkout remains available if you prefer not to sign in next time.
      </p>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 md:rounded-3xl md:p-6">
        <div className="flex items-start gap-4">
          <div
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-white"
          >
            {initials(customer.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl leading-tight">{customer.fullName}</h2>
            <p className="mt-2 space-y-1 text-sm text-muted">
              <a className="block truncate hover:text-foreground" href={`mailto:${customer.email}`}>
                {customer.email}
              </a>
              <a className="block hover:text-foreground" href={phoneHref}>
                {customer.phone}
              </a>
            </p>
          </div>
        </div>
        <form
          className="mt-5 border-t border-border pt-4"
          action={async () => {
            "use server";
            await customerLogout();
            redirect("/");
          }}
        >
          <button type="submit" className={buttonClass("secondary", "h-11 w-full sm:w-auto")}>
            Sign out
          </button>
        </form>
      </section>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: "/wishlist", label: "Wishlist", hint: "Saved on this phone", icon: Heart },
          { href: "/orders/track", label: "Track an order", hint: "Reference and phone", icon: PackageSearch },
          { href: "/shop", label: "Browse the shop", hint: "Current Accra stock", icon: Store },
        ].map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex h-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-foreground transition-colors hover:border-accent/40"
            >
              <item.icon className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-1 block text-xs text-muted">{item.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-2xl">Orders</h2>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center md:rounded-3xl">
            <p className="font-serif text-xl">No orders yet</p>
            <p className="mx-auto mt-2 max-w-sm text-pretty text-sm text-muted">
              When you place an order with this account, the reference and Ghana Cedi total will show here.
            </p>
            <Link href="/shop" className={buttonClass("primary", "mt-6 h-12")}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/track?ref=${encodeURIComponent(order.publicRef)}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-foreground md:p-5"
                >
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">{order.publicRef}</p>
                    <p className="mt-1 text-sm capitalize text-muted">
                      {new Date(order.createdAt).toLocaleDateString("en-GH")} · {labelStatus(order.status)} ·{" "}
                      {labelStatus(order.paymentStatus)}
                    </p>
                  </div>
                  <p className="price text-lg">{formatGhs(Number(order.total))}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
