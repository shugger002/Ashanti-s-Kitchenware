import { DisabledProvider } from "@/server/payments/disabled";
import { HubtelProvider, isHubtelConfigured } from "@/server/payments/hubtel";
import { MoolreProvider, isMoolreConfigured } from "@/server/payments/moolre";
import { PaystackProvider } from "@/server/payments/paystack";
import type { PaymentOption, PaymentProvider, PaymentProviderId } from "@/server/payments/types";

export function listConfiguredPaymentProviders(): PaymentOption[] {
  const options: PaymentOption[] = [];
  if (isHubtelConfigured()) {
    options.push({
      id: "hubtel",
      label: "Hubtel",
      description: "Card, mobile money, and GHQR on Hubtel. You leave this page to pay. This shop does not collect card numbers.",
    });
  }
  if (isMoolreConfigured()) {
    options.push({
      id: "moolre",
      label: "Moolre",
      description: "Mobile money prompt on your phone (MTN, Telecel, or AT). Approve it with your PIN. The order is paid only after Moolre confirms.",
    });
  }
  return options;
}

export function getPaymentProvider(id?: string | null): PaymentProvider {
  const configured = listConfiguredPaymentProviders();
  const requested = (id ?? configured[0]?.id) as PaymentProviderId | undefined;
  if (requested === "hubtel" && isHubtelConfigured()) return new HubtelProvider();
  if (requested === "moolre" && isMoolreConfigured()) return new MoolreProvider();
  if (requested === "paystack" && process.env.PAYSTACK_SECRET_KEY) return new PaystackProvider();
  if (!requested && process.env.PAYSTACK_SECRET_KEY) return new PaystackProvider();
  return new DisabledProvider();
}

export function paymentsAreReady(): boolean {
  return listConfiguredPaymentProviders().length > 0 || Boolean(process.env.PAYSTACK_SECRET_KEY);
}
