import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { orderStatusLabel } from "@/lib/order-status";

export function adminButton(className?: string) {
  return buttonClass("primary", cn("h-12 min-h-12 w-full sm:w-auto", className));
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
        "flex flex-wrap gap-4 rounded-xl border border-white/90 bg-white/95 px-5 py-4 shadow-sm backdrop-blur-md",
        align === "center" ? "flex-col items-center text-center" : "items-start justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl leading-tight text-foreground sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed text-neutral-800",
              align === "center" ? "max-w-lg" : "max-w-xl",
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

export function liveOrderBadge(paymentStatus: string, status: string) {
  if (status === "delivered" || status === "collected") return "FULFILLED";
  if (paymentStatus === "paid") return "PAID";
  return "PENDING";
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
        "inline-flex rounded-full px-2 py-0.5 text-[11px]",
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
    <div className={cn("hidden overflow-x-auto rounded-xl border border-border bg-surface md:block", className)}>
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
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="font-serif text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-col gap-2 rounded-xl border border-border bg-white/95 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex min-h-11 items-center rounded-md bg-white/95 px-2 py-1 text-sm text-neutral-800 hover:text-foreground"
    >
      {children}
    </Link>
  );
}
