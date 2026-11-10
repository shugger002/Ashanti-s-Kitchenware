import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StoreLogo } from "@/components/store/logo";
import { brand } from "@/config/brand";

export function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 lg:h-[4.5rem] lg:px-8">
          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center gap-0.5 text-sm text-muted hover:text-foreground"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden />
            Cart
          </Link>
          <Link href="/" className="flex max-w-[12rem] items-center sm:max-w-[16rem]" aria-label={brand.name}>
            <StoreLogo className="h-9 w-auto max-w-full lg:h-11" />
          </Link>
          <p className="w-16 shrink-0 text-right text-[11px] text-muted sm:w-auto">GH₵</p>
        </div>
      </header>
      {children}
      <footer className="border-t border-border pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-1 px-4 py-3 text-xs text-muted lg:px-8 lg:py-6">
          <Link href="/refunds" className="min-h-11 py-2 hover:text-foreground lg:min-h-0 lg:py-0">
            Refund policy
          </Link>
          <Link href="/faq" className="min-h-11 py-2 hover:text-foreground lg:min-h-0 lg:py-0">
            Shipping
          </Link>
          <Link href="/privacy" className="min-h-11 py-2 hover:text-foreground lg:min-h-0 lg:py-0">
            Privacy policy
          </Link>
          <Link href="/terms" className="min-h-11 py-2 hover:text-foreground lg:min-h-0 lg:py-0">
            Terms of service
          </Link>
        </nav>
      </footer>
    </div>
  );
}

export function CheckoutPaper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 lg:px-8 lg:py-16">
      <div className="border border-border bg-surface px-5 py-8 sm:px-8 sm:py-10">{children}</div>
    </div>
  );
}
