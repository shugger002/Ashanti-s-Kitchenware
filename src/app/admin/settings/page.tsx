import { requirePermission } from "@/server/auth/authorize";
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
        description="Legal name Ashanti's Kitchenware. The homepage photo is the utensils wall — it is not uploaded here. Delivery is quoted on WhatsApp, not charged at checkout."
      />
      <form action={saveContact} className="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-serif text-xl">Contact</h2>
        <Field name="legalName" label="Legal name" defaultValue={config.contact.legalName} />
        <Field name="tradingName" label="Trading name" defaultValue={config.contact.tradingName} />
        <Field name="email" label="Email" defaultValue={config.contact.email} />
        <Field name="phoneDisplay" label="Phone (display)" defaultValue={config.contact.phoneDisplay} />
        <Field name="phoneE164" label="Phone (E.164)" defaultValue={config.contact.phoneE164} />
        <Field name="whatsappE164" label="WhatsApp (E.164)" defaultValue={config.contact.whatsappE164} />
        <Field name="addressLine1" label="Address" defaultValue={config.contact.addressLine1} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field name="city" label="City" defaultValue={config.contact.city} />
          <Field name="region" label="Region" defaultValue={config.contact.region} />
          <Field name="country" label="Country" defaultValue={config.contact.country} />
        </div>
        <button className={adminButton("w-fit")} type="submit">
          Save contact
        </button>
      </form>
      <form action={saveHero} className="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-serif text-xl">Homepage copy</h2>
        <p className="text-sm leading-relaxed text-muted">
          These lines sit under the utensils photo. The announcement bar is the strip at the very top of the shop.
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
        <button className={adminButton("w-fit")} type="submit">
          Save homepage
        </button>
      </form>
      <section className="max-w-xl rounded-xl border border-border bg-surface p-5">
        <h2 className="text-xl">Shop extras</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Categories, customers, inventory counts, and WhatsApp delivery sit here so the main rail matches the live
          admin.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a href="/admin/inventory" className={adminButton("inline-flex w-fit")}>
            Inventory
          </a>
          <a href="/admin/categories" className="text-muted hover:text-foreground">
            Categories
          </a>
          <a href="/admin/customers" className="text-muted hover:text-foreground">
            Customers
          </a>
          <a href="/admin/delivery" className="text-muted hover:text-foreground">
            Delivery
          </a>
        </div>
      </section>
    </div>
  );
}
