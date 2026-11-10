import { CheckoutPageSkeleton } from "@/components/ui/skeleton";
import { CheckoutShell } from "@/components/store/checkout-shell";

export default function CheckoutLoading() {
  return (
    <CheckoutShell>
      <CheckoutPageSkeleton />
    </CheckoutShell>
  );
}
