/** Staff labels aligned with the customer tracker steps. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Order Received",
  paid: "Order Received",
  packing: "Packaging order",
  shipped: "Order Out for Delivery",
  ready_for_collection: "Ready at the shop",
  delivered: "Order Delivered",
  collected: "Collected",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

export const CUSTOMER_TRACK_STEPS = [
  "Order Received",
  "Packaging order",
  "Order Out for Delivery",
  "Order Delivered",
] as const;

export function customerTrackIndex(status: string) {
  if (status === "cancelled" || status === "refunded") return -1;
  if (status === "delivered" || status === "collected") return 3;
  if (status === "shipped" || status === "ready_for_collection") return 2;
  if (status === "packing") return 1;
  return 0;
}
