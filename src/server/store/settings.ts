import { query } from "@/server/db/pool";
import { defaultContact } from "@/config/brand";

export type ContactSettings = {
  legalName: string;
  tradingName: string;
  email: string;
  phoneDisplay: string;
  phoneE164: string;
  whatsappE164: string;
  addressLine1: string;
  city: string;
  region: string;
  country: string;
  sourceNote?: string;
};

export type HeroSettings = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  placeholder?: boolean;
};

export type AnnouncementSettings = {
  enabled: boolean;
  text: string;
};

export type SocialSettings = {
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
};

export type FulfillmentSettings = {
  coverage: "accra" | "nationwide";
  collectionEnabled: boolean;
  deliveryEnabled: boolean;
  coverageNote: string;
};

export type StorefrontConfig = {
  contact: ContactSettings;
  hero: HeroSettings;
  announcement: AnnouncementSettings;
  social: SocialSettings;
  fulfillment: FulfillmentSettings;
};

const fallback: StorefrontConfig = {
  contact: { ...defaultContact },
  hero: {
    title: "What are you cooking tonight?",
    subtitle:
      "Start with a range. Every photograph is of stock from the shop — pots, appliances, and tableware priced in Ghana Cedis.",
    ctaLabel: "Shop",
    ctaHref: "/shop",
    placeholder: true,
  },
  announcement: {
    enabled: true,
    text: "Demo photography is on this site for layout. Replace with photographed stock before launch.",
  },
  social: { instagram: "", facebook: "", twitter: "", linkedin: "" },
  fulfillment: {
    coverage: "accra",
    collectionEnabled: true,
    deliveryEnabled: true,
    coverageNote: "Collection at the Accra shop. Delivery cost and timing are confirmed on WhatsApp after you order.",
  },
};

async function readJson<T>(key: string, fallbackValue: T): Promise<T> {
  try {
    const result = await query<{ value: T }>(
      `SELECT value FROM store_settings WHERE key = $1`,
      [key],
    );
    return result.rows[0]?.value ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export async function getStorefrontConfig(): Promise<StorefrontConfig> {
  const [contact, hero, announcement, social, storedFulfillment] = await Promise.all([
    readJson("contact", fallback.contact),
    readJson("hero", fallback.hero),
    readJson("announcement", fallback.announcement),
    readJson("social", fallback.social),
    readJson("fulfillment", fallback.fulfillment),
  ]);
  const fulfillment = storedFulfillment.coverageNote.includes("rate is published")
    ? { ...storedFulfillment, coverageNote: fallback.fulfillment.coverageNote }
    : storedFulfillment;
  const liveAnnouncement = announcement.text.toLowerCase().includes("logo")
    ? fallback.announcement
    : announcement;
  const liveContact =
    contact.legalName === "Ashantis Kitchenware" || contact.tradingName === "Ashantis Kitchenware"
      ? { ...contact, legalName: fallback.contact.legalName, tradingName: fallback.contact.tradingName }
      : contact;
  return { contact: liveContact, hero, announcement: liveAnnouncement, social, fulfillment };
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  await query(
    `INSERT INTO store_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

export { listActiveShippingRates as listShippingRates } from "@/server/shipping/service";
