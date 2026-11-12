import { CheckoutForm } from "@/components/store/checkout-form";
import { CheckoutPaper, CheckoutShell } from "@/components/store/checkout-shell";
import { pageMeta } from "@/lib/seo";
import { readStoreCustomer } from "@/server/customers/session";
import { getStorefrontConfig } from "@/server/store/settings";
import { getOperationsConfig } from "@/server/ops/settings";
import { listConfiguredPaymentProviders } from "@/server/payments";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Checkout",
  description: "Complete your Ashanti's Kitchenware order.",
  path: "/checkout",
});

export default async function CheckoutPage() {
  const [customer, config, ops] = await Promise.all([
    readStoreCustomer(),
    getStorefrontConfig(),
    getOperationsConfig(),
  ]);
  if (ops.checkoutPaused) {
    return (
      <CheckoutShell>
        <CheckoutPaper>
          <h1 className="font-serif text-3xl">Checkout is paused</h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">{ops.maintenanceMessage}</p>
          <p className="mt-3 text-sm text-muted">Your cart is still saved on this phone.</p>
          <Link href="/cart" className={buttonClass("primary", "mt-6 h-12")}>
            Back to cart
          </Link>
        </CheckoutPaper>
      </CheckoutShell>
    );
  }
  return (
    <CheckoutShell>
      <CheckoutForm
        customer={customer ? { fullName: customer.fullName, email: customer.email, phone: customer.phone } : null}
        fulfillment={config.fulfillment}
        paymentOptions={listConfiguredPaymentProviders()}
        whatsappE164={config.contact.whatsappE164}
      />
    </CheckoutShell>
  );
}
