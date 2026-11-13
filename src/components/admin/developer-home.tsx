import Link from "next/link";
import type { AdminUser } from "@/server/auth/types";
import { adminButton, AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

const sections = [
  {
    title: "Business",
    body: "Orders, paid takings, unpaid tickets, low stock, and packing.",
    links: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/pack", label: "Pack desk" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    title: "Catalogue",
    body: "Add and edit products, photos, prices, stock, and discounts from this phone.",
    links: [
      { href: "/admin/products/new", label: "Add product" },
      { href: "/admin/products", label: "Edit products" },
      { href: "/admin/inventory", label: "Stock" },
      { href: "/admin/promotions", label: "Discounts" },
    ],
  },
  {
    title: "Customers",
    body: "Search orders and customers. Payment stays separate from packing.",
    links: [
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/orders?status=pending_payment", label: "Unpaid" },
    ],
  },
  {
    title: "Website",
    body: "Homepage words, contact, and published delivery rates.",
    links: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/delivery", label: "Delivery" },
    ],
  },
  {
    title: "Maintenance",
    body: "Pause checkout, health, failed tasks, and hosting shortcuts. Secrets stay in Vercel.",
    links: [
      { href: "/admin/ops", label: "Operations" },
      { href: "/admin/services", label: "Connections" },
      { href: "/admin/activity", label: "Activity" },
    ],
  },
];

export function DeveloperHome({ user }: { user: AdminUser }) {
  return (
    <div>
      <AdminPageHeader
        title="Operations desk"
        description={`${user.email} can run the Accra shop and the website from this phone. Shop staff do not see Operations.`}
        action={
          <Link href="/admin/ops" className={adminButton()}>
            Operations
          </Link>
        }
      />
      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <AdminSection key={section.title} title={section.title} hint={section.body}>
            <div className="flex flex-col gap-2">
              {section.links.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={index === 0 ? adminButton() : buttonClass("secondary", "h-12 min-h-12 w-full")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </AdminSection>
        ))}
      </div>
    </div>
  );
}
