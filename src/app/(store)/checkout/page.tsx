import { CheckoutForm } from "@/components/store/checkout-form";
import { CheckoutPaper, CheckoutShell } from "@/components/store/checkout-shell";
import { pageMeta } from "@/lib/seo";
import { readStoreCustomer } from "@/server/customers/session";
import { getStorefrontConfig, storefrontFallback } from "@/server/store/settings";
import { DEFAULT_OPERATIONS, getOperationsConfig } from "@/server/ops/settings";
import { listConfiguredPaymentProviders } from "@/server/payments";
import { listActiveShippingRates } from "@/server/shipping/service";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Checkout",
  description: "Complete your Ashanti's Kitchenware order.",
  path: "/checkout",
  index: false,
});

async function loadCheckoutPage() {
  const [customer, config, ops, shippingRates] = await Promise.all([
    readStoreCustomer(),
    getStorefrontConfig(),
    getOperationsConfig(),
    listActiveShippingRates(),
  ]);
  return { customer, config, ops, shippingRates };
}

export default async function CheckoutPage() {
  const loaded = await Promise.race([
    loadCheckoutPage().catch(() => null),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 150);
    }),
  ]);
  const customer = loaded?.customer ?? null;
  const config = loaded?.config ?? storefrontFallback;
  const ops = loaded?.ops ?? DEFAULT_OPERATIONS;
  if (ops.checkoutPaused) {
    return (
      <CheckoutShell>
        <CheckoutPaper>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">Checkout</p>
          <h1 className="mt-2 font-sans text-3xl font-bold uppercase tracking-[0.08em]">Checkout is paused</h1>
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
        shippingRates={loaded?.shippingRates ?? []}
        whatsappE164={config.contact.whatsappE164}
      />
    </CheckoutShell>
  );
}
