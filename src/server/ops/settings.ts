import { revalidatePath, revalidateTag } from "next/cache";
import { query } from "@/server/db/pool";
import { sql } from "@/server/db/sql";
import { writeAuditLog } from "@/server/auth/audit";

export type OperationsConfig = {
  checkoutPaused: boolean;
  maintenanceMessage: string;
  reviewsEnabled: boolean;
  newsletterEnabled: boolean;
  promoPopupEnabled: boolean;
};

export const DEFAULT_OPERATIONS: OperationsConfig = {
  checkoutPaused: false,
  maintenanceMessage:
    "Checkout is paused while we update the shop. Your cart is saved. WhatsApp the Accra shop if you need to order now.",
  reviewsEnabled: true,
  newsletterEnabled: true,
  promoPopupEnabled: true,
};

export class CheckoutPausedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutPausedError";
  }
}

export function parseOperations(value: unknown): OperationsConfig {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const message =
    typeof raw.maintenanceMessage === "string" && raw.maintenanceMessage.trim()
      ? raw.maintenanceMessage.trim().slice(0, 280)
      : DEFAULT_OPERATIONS.maintenanceMessage;
  return {
    checkoutPaused: raw.checkoutPaused === true,
    maintenanceMessage: message,
    reviewsEnabled: raw.reviewsEnabled !== false,
    newsletterEnabled: raw.newsletterEnabled !== false,
    promoPopupEnabled: raw.promoPopupEnabled !== false,
  };
}

export async function getOperationsConfig(): Promise<OperationsConfig> {
  try {
    const result = await query<{ value: unknown }>(sql`SELECT value FROM store_settings WHERE key = 'operations'`);
    return parseOperations(result.rows[0]?.value);
  } catch {
    return DEFAULT_OPERATIONS;
  }
}

export async function saveOperationsConfig(
  next: OperationsConfig,
  actorUserId: string,
): Promise<OperationsConfig> {
  const parsed = parseOperations(next);
  await query(sql`
    INSERT INTO store_settings (key, value, updated_at)
     VALUES ('operations', ${JSON.stringify(parsed)}::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()
  `);
  await writeAuditLog({
    actorUserId,
    action: parsed.checkoutPaused ? "ops.checkout.pause" : "ops.settings.update",
    entityType: "settings",
    entityId: "operations",
    metadata: {
      checkoutPaused: parsed.checkoutPaused,
      reviewsEnabled: parsed.reviewsEnabled,
      newsletterEnabled: parsed.newsletterEnabled,
      promoPopupEnabled: parsed.promoPopupEnabled,
    },
  });
  revalidateTag("storefront", { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/checkout");
  revalidatePath("/cart");
  revalidatePath("/admin/ops");
  return parsed;
}

export async function assertCheckoutOpen(): Promise<OperationsConfig> {
  const config = await getOperationsConfig();
  if (config.checkoutPaused) {
    throw new CheckoutPausedError(config.maintenanceMessage);
  }
  return config;
}
