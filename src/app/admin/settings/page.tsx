import { requirePermission } from "@/server/auth/authorize";
import { shopMap } from "@/config/brand";
import { getStorefrontConfig, updateSetting } from "@/server/store/settings";
import { revalidatePath } from "next/cache";
import { adminButton, AdminPageHeader } from "@/components/admin/ui";

async function saveContact(formData: FormData) {
  "use server";
  await requirePermission("settings.write");
  await updateSetting("contact", {
    legalName: String(formData.get("legalName")),
    tradingName: String(formData.get("tradingName")),
    email: String(formData.get("email")),
    phoneDisplay: String(formData.get("phoneDisplay")),
    phoneE164: String(formData.get("phoneE164")),
    whatsappE164: String(formData.get("whatsappE164")),
    addressLine1: String(formData.get("addressLine1")),
    city: String(formData.get("city")),
    region: String(formData.get("region")),
    country: String(formData.get("country")),
    mapsUrl: shopMap.url,
  });
  revalidatePath("/");
}

async function saveHero(formData: FormData) {
  "use server";
  await requirePermission("settings.write");
  await updateSetting("hero", {
    title: String(formData.get("title")),
    subtitle: String(formData.get("subtitle")),
    ctaLabel: String(formData.get("ctaLabel")),
    ctaHref: String(formData.get("ctaHref")),
    placeholder: false,
  });
  await updateSetting("announcement", {
    enabled: formData.get("announcementEnabled") === "on",
    text: String(formData.get("announcementText") ?? ""),
  });
  revalidatePath("/");
}

function Field({
  name,
  label,
  defaultValue,
  as = "input",
}: {
  name: string;
  label: string;
  defaultValue: string;
  as?: "input" | "textarea";
}) {
  return (
    <label className="block text-sm">
      {label}
      {as === "textarea" ? (
        <textarea name={name} defaultValue={defaultValue} rows={3} className="input mt-1" />
      ) : (
        <input name={name} defaultValue={defaultValue} className="input mt-1" />
      )}
    </label>
  );
}

export default async function SettingsPage() {
  const [, config] = await Promise.all([requirePermission("settings.write"), getStorefrontConfig()]);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Shop name, phone, address, and the words on the homepage. Delivery is still quoted on WhatsApp."
      />
      <form action={saveContact} className="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-serif text-xl">Contact</h2>
        <Field name="legalName" label="Legal name" defaultValue={config.contact.legalName} />
        <Field name="tradingName" label="Trading name" defaultValue={config.contact.tradingName} />
        <Field name="email" label="Email" defaultValue={config.contact.email} />
        <Field name="phoneDisplay" label="Phone as customers see it" defaultValue={config.contact.phoneDisplay} />
        <Field name="phoneE164" label="Phone for calling (with country code)" defaultValue={config.contact.phoneE164} />
        <Field name="whatsappE164" label="WhatsApp number (with country code)" defaultValue={config.contact.whatsappE164} />
        <Field name="addressLine1" label="Address" defaultValue={config.contact.addressLine1} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field name="city" label="City" defaultValue={config.contact.city} />
          <Field name="region" label="Region" defaultValue={config.contact.region} />
          <Field name="country" label="Country" defaultValue={config.contact.country} />
        </div>
        <button className={adminButton()} type="submit">
          Save contact
        </button>
      </form>
      <form action={saveHero} className="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-serif text-xl">Homepage words</h2>
        <p className="text-sm leading-relaxed text-muted">
          These sit under the utensils photo. The announcement is the thin strip at the very top of the shop.
        </p>
        <Field name="title" label="Intro title" defaultValue={config.hero.title} />
        <Field name="subtitle" label="Intro text" defaultValue={config.hero.subtitle} as="textarea" />
        <Field name="ctaLabel" label="Button label" defaultValue={config.hero.ctaLabel} />
        <Field name="ctaHref" label="Button link" defaultValue={config.hero.ctaHref} />
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="announcementEnabled" defaultChecked={config.announcement.enabled} />
          Show announcement bar
        </label>
        <Field name="announcementText" label="Announcement text" defaultValue={config.announcement.text} />
        <button className={adminButton()} type="submit">
          Save homepage
        </button>
      </form>
      <section className="max-w-xl rounded-xl border border-border bg-surface p-5">
        <h2 className="text-xl">Other desk pages</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">Stock, categories, customers, and delivery are on their own pages.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a href="/admin/inventory" className={adminButton()}>
            Inventory
          </a>
          <a href="/admin/categories" className="inline-flex h-12 items-center justify-center text-sm text-muted hover:text-foreground sm:px-3">
            Categories
          </a>
          <a href="/admin/customers" className="inline-flex h-12 items-center justify-center text-sm text-muted hover:text-foreground sm:px-3">
            Customers
          </a>
          <a href="/admin/delivery" className="inline-flex h-12 items-center justify-center text-sm text-muted hover:text-foreground sm:px-3">
            Delivery
          </a>
        </div>
      </section>
    </div>
  );
}
