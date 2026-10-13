import { CheckoutForm } from "@/components/store/checkout-form";
import { CheckoutShell } from "@/components/store/checkout-shell";
import { pageMeta } from "@/lib/seo";
import { readStoreCustomer } from "@/server/customers/session";
import { getStorefrontConfig } from "@/server/store/settings";
import { listConfiguredPaymentProviders } from "@/server/payments";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Checkout",
  description: "Complete your Ashanti's Kitchenware order.",
  path: "/checkout",
});

export default async function CheckoutPage() {
  const [customer, config] = await Promise.all([readStoreCustomer(), getStorefrontConfig()]);
  return (
    <CheckoutShell>
      <h1 className="sr-only">Checkout</h1>
      <CheckoutForm
        customer={customer ? { fullName: customer.fullName, email: customer.email, phone: customer.phone } : null}
        fulfillment={config.fulfillment}
        paymentOptions={listConfiguredPaymentProviders()}
        whatsappE164={config.contact.whatsappE164}
      />
    </CheckoutShell>
  );
}
