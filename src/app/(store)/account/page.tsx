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
    <div className="mx-auto max-w-3xl px-4 py-8 pb-[calc(var(--store-dock)+2rem)] lg:px-8 lg:py-16 lg:pb-16">
      <p className="text-xs font-medium uppercase text-muted">Signed in</p>
      <h1 className="mt-2 text-3xl md:text-4xl">Your account</h1>
      <p className="mt-2 max-w-xl text-pretty text-sm text-muted">Orders for this email stay on the account.</p>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4 md:p-6">
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

      <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { href: "/wishlist", label: "Wishlist", icon: Heart },
          { href: "/orders/track", label: "Track order", icon: PackageSearch },
          { href: "/shop", label: "Shop", icon: Store },
        ].map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-2 py-4 text-center text-foreground transition-colors hover:border-accent/40"
            >
              <item.icon className="size-5 text-accent" strokeWidth={1.5} />
              <span className="text-xs font-medium sm:text-sm">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-2xl">Orders</h2>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center">
            <p className="font-serif text-xl">No orders yet</p>
            <p className="mx-auto mt-2 max-w-sm text-pretty text-sm text-muted">
              Orders placed with this account will list here with the Ghana Cedi total.
            </p>
            <Link href="/shop" className={buttonClass("primary", "mt-4 h-11")}>
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
