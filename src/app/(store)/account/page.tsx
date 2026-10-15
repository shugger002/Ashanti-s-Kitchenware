import Link from "next/link";
import { redirect } from "next/navigation";
import { customerLogout } from "@/app/(store)/login/actions";
import { pageMeta } from "@/lib/seo";
import { formatGhs } from "@/lib/money";
import { readStoreCustomer } from "@/server/customers/session";
import { listOrdersForCustomer } from "@/server/orders/service";

export const metadata = pageMeta({
  title: "Your account",
  description: "Orders and details for your Ashanti's Kitchenware account.",
  path: "/account",
});

export default async function AccountPage() {
  const customer = await readStoreCustomer();
  if (!customer) redirect("/login");
  const orders = await listOrdersForCustomer(customer.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16">
      <h1 className="text-3xl md:text-4xl">Your account</h1>
      <p className="mt-3 text-muted">
        {customer.fullName}
        <br />
        {customer.email}
        <br />
        {customer.phone}
      </p>
      <form
        className="mt-4"
        action={async () => {
          "use server";
          await customerLogout();
          redirect("/");
        }}
      >
        <button type="submit" className="text-sm text-accent">
          Sign out
        </button>
      </form>

      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/wishlist" className="text-accent">
          Wishlist
        </Link>
        <Link href="/orders/track" className="text-accent">
          Track an order
        </Link>
        <Link href="/shop" className="text-accent">
          Recently viewed lives on product pages
        </Link>
      </p>

      <h2 className="mt-12 text-2xl">Orders</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-muted">
          No orders on this account yet. <Link href="/shop">Browse the shop</Link>
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium">{order.publicRef}</p>
                <p className="text-muted">
                  {new Date(order.createdAt).toLocaleDateString("en-GH")} · {order.status.replaceAll("_", " ")} ·{" "}
                  {order.paymentStatus.replaceAll("_", " ")}
                </p>
              </div>
              <p className="price">{formatGhs(Number(order.total))}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
