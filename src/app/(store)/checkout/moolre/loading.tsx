import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutPaper, CheckoutShell } from "@/components/store/checkout-shell";

export default function MoolreLoading() {
  return (
    <CheckoutShell>
      <CheckoutPaper>
        <div aria-busy="true" role="status" aria-label="Loading payment confirmation">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-8 h-14 w-full" />
          <Skeleton className="mt-4 h-12 w-full" />
        </div>
      </CheckoutPaper>
    </CheckoutShell>
  );
}
