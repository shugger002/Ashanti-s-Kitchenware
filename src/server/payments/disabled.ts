import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifiedPaymentEvent,
} from "@/server/payments/types";
import { getAppUrl } from "@/server/env";

export class DisabledProvider implements PaymentProvider {
  readonly id = "disabled" as const;

  async createIntent(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      provider: this.id,
      providerRef: input.publicRef,
      redirectUrl: `${getAppUrl()}/checkout/success?ref=${encodeURIComponent(input.publicRef)}`,
      status: "pending",
    };
  }

  async parseWebhook(): Promise<VerifiedPaymentEvent> {
    throw new Error("The disabled payment provider does not accept webhooks");
  }
}
