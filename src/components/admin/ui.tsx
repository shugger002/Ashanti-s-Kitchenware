import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { orderStatusLabel } from "@/lib/order-status";

export function adminButton(className?: string) {
  return buttonClass("primary", cn("h-12 min-h-12 w-full sm:w-auto", className));
}

export function adminPanel(className?: string) {
  return cn("admin-panel", className);
}

export function AdminPageHeader({
  title,
  description,
  action,
  align = "start",
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-5 border-b border-[color-mix(in_srgb,var(--accent)_18%,transparent)] pb-6",
        align === "center" ? "flex-col items-center text-center" : "items-end justify-between",
        className,
      )}
    >
      <div>
        <h1 className="max-w-2xl text-[2rem] leading-[1.1] text-foreground sm:text-[2.35rem]">{title}</h1>
        <span className="mt-3 block h-px w-12 bg-accent" aria-hidden />
        {description ? (
          <p
            className={cn(
              "mt-3 max-w-xl text-[0.95rem] leading-relaxed text-neutral-800",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">{action}</div> : null}
    </div>
  );
}

export function AdminSection({
  step,
  title,
  hint,
  action,
  children,
  className,
}: {
  step?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("admin-panel", className)}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {step ? <span className="admin-step">{step}</span> : null}
          <div>
            <h2 className="text-[1.35rem] leading-tight">{title}</h2>
            {hint ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function AdminGlance({
  items,
  className,
}: {
  items: { href?: string; label: string; value: string | number; warn?: boolean }[];
  className?: string;
}) {
  const cols =
    items.length === 3 ? "sm:grid-cols-3" : items.length <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-4";
  return (
    <ul
      className={cn(
        "mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] bg-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)]",
        cols,
        className,
      )}
    >
      {items.map((item) => {
        const inner = (
          <>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{item.label}</span>
            <span className={cn("mt-1 font-serif text-xl tabular-nums", item.warn ? "text-accent" : "text-foreground")}>
              {item.value}
            </span>
          </>
        );
        return (
          <li key={item.label} className="bg-[#fffdf8]">
            {item.href ? (
              <Link href={item.href} className="flex min-h-16 flex-col justify-center px-4 py-3 sm:px-5">
                {inner}
              </Link>
            ) : (
              <div className="flex min-h-16 flex-col justify-center px-4 py-3 sm:px-5">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AdminStat({
  href,
  label,
  value,
  hint,
  warn,
  size = "default",
}: {
  href?: string;
  label: string;
  value: string | number;
  hint?: string;
  warn?: boolean;
  size?: "default" | "lg";
}) {
  const inner = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{label}</p>
      <p
        className={cn(
          "admin-stat-value mt-3 font-serif text-[2.05rem] leading-none tabular-nums",
          warn && "text-accent",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-snug text-muted">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className={cn("admin-stat", size === "lg" && "admin-stat-lg", warn && "admin-stat-warn")}>
      {inner}
    </Link>
  ) : (
    <div className={cn("admin-stat", size === "lg" && "admin-stat-lg", warn && "admin-stat-warn")}>{inner}</div>
  );
}

export function liveOrderBadge(paymentStatus: string, status: string) {
  if (status === "delivered" || status === "collected") return "Delivered";
  if (paymentStatus === "paid") return "Paid";
  return "Waiting";
}

export function staffJobLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Store owner",
    store_admin: "Shop desk",
    inventory_manager: "Stock",
    order_manager: "Orders",
  };
  return labels[role] ?? role.replaceAll("_", " ");
}

export function deskActionLabel(action: string) {
  const labels: Record<string, string> = {
    "auth.login": "Signed in",
    "auth.password_reset_requested": "Asked for a new password",
    "auth.password_reset_completed": "Changed password",
    "product.create": "Added a product",
    "product.update": "Edited a product",
    "product.archive": "Removed a product",
    "product.sale_price": "Changed a sale price",
    "inventory.adjust": "Changed stock",
    "inventory.sale": "Sold a piece in the shop",
    "inventory.csv": "Updated stock from a file",
    "order.transition": "Moved an order",
    "payments.capture": "Marked an order paid",
    "coupon.create": "Added a coupon",
    "coupon.update": "Changed a coupon",
    "coupon.activate": "Turned a coupon on",
    "coupon.deactivate": "Turned a coupon off",
    "review.publish": "Published a review",
    "review.unpublish": "Hid a review",
  };
  return labels[action] ?? action.replaceAll(".", " · ");
}

export function statusLabel(value: string) {
  return orderStatusLabel(value);
}

export function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    paid: "Paid",
    unpaid: "Unpaid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function StatusPill({
  value,
  tone = "neutral",
  label,
}: {
  value: string;
  tone?: "neutral" | "attention" | "ok" | "muted";
  label?: string;
}) {
  const text = label ?? statusLabel(value);
  return (
    <span
      className={cn(
        "inline-flex rounded-sm px-2 py-0.5 text-[11px] font-medium tracking-wide",
        /[A-Z]/.test(text) ? "" : "capitalize",
        tone === "attention" && "bg-accent/10 text-accent",
        tone === "ok" && "bg-foreground text-background",
        tone === "muted" && "bg-surface text-muted",
        tone === "neutral" && "border border-border bg-background text-foreground",
      )}
    >
      {text}
    </span>
  );
}

export function paymentTone(status: string): "ok" | "attention" | "muted" {
  if (status === "paid") return "ok";
  if (status === "failed" || status === "pending" || status === "unpaid") return "attention";
  return "muted";
}

export function orderTone(status: string): "ok" | "attention" | "muted" | "neutral" {
  if (status === "cancelled" || status === "refunded") return "muted";
  if (status === "pending_payment") return "attention";
  if (status === "delivered" || status === "collected") return "ok";
  return "neutral";
}

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hidden overflow-x-auto border border-[color-mix(in_srgb,var(--accent)_12%,#eadfd4)] bg-[#fffdf8] md:block", className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function MobileCards({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("mt-4 space-y-3 md:hidden", className)}>{children}</ul>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-panel px-6 py-14 text-center">
      <p className="font-serif text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-panel mt-6 flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex min-h-11 items-center text-sm text-neutral-800 hover:text-accent"
    >
      {children}
    </Link>
  );
}
