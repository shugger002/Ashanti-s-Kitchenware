import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { orderStatusLabel } from "@/lib/order-status";

export function adminButton(className?: string) {
  return buttonClass("primary", className);
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] leading-tight">{title}</h1>
        {description ? <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
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
    <div className={cn("overflow-x-auto rounded-2xl border border-border bg-background", className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
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
    <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center">
      <p className="font-serif text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background p-3">{children}</div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-block text-sm text-muted hover:text-foreground">
      {children}
    </Link>
  );
}
