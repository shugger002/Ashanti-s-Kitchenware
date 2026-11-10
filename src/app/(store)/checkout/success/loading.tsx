import { CheckoutPageSkeleton } from "@/components/ui/skeleton";
import { CheckoutShell } from "@/components/store/checkout-shell";

export default function CheckoutSuccessLoading() {
  return (
    <CheckoutShell>
      <CheckoutPageSkeleton />
    </CheckoutShell>
  );
}
