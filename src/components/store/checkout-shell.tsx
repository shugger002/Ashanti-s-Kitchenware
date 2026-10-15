import Link from "next/link";
import { Lock } from "lucide-react";
import { StoreLogo } from "@/components/store/logo";
import { brand } from "@/config/brand";

export function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-center px-4 lg:h-16 lg:justify-between lg:px-8">
          <Link href="/" className="flex items-center" aria-label={brand.name}>
            <StoreLogo className="h-8 w-auto max-w-[11rem] lg:h-9 lg:max-w-[13rem]" />
          </Link>
          <p className="absolute right-4 flex items-center gap-1.5 text-[11px] text-muted lg:static lg:text-xs">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            <span className="hidden sm:inline">Secure checkout</span>
          </p>
        </div>
      </header>
      {children}
      <footer className="border-t border-border pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-xs text-muted lg:px-8 lg:py-5">
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
