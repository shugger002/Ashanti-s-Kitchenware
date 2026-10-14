export type PaymentProviderId = "hubtel" | "moolre" | "paystack" | "disabled";

export type CreatePaymentInput = {
  orderId: string;
  publicRef: string;
  email: string;
  fullName: string;
  phone: string;
  amountGhs: number;
  callbackUrl: string;
  momoChannel?: "13" | "6" | "7";
  otpCode?: string;
};

export type CreatePaymentResult = {
  provider: string;
  providerRef: string | null;
  redirectUrl: string | null;
  status: "initialized" | "pending";
  otpRequired?: boolean;
};

export type VerifiedPaymentEvent = {
  provider: string;
  providerEventId: string;
  providerRef: string;
  eventType: string;
  successful: boolean;
  amountGhs: number;
  payload: Record<string, unknown>;
};

export type PaymentOption = {
  id: Exclude<PaymentProviderId, "disabled">;
  label: string;
  description: string;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createIntent(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  parseWebhook(rawBody: Buffer, headers: Headers): Promise<VerifiedPaymentEvent>;
}
