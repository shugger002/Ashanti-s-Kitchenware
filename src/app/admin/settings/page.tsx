import { requirePermission } from "@/server/auth/authorize";
import { shopMap } from "@/config/brand";
import { getStorefrontConfig, updateSetting } from "@/server/store/settings";
import { writeAuditLog } from "@/server/auth/audit";
import { revalidatePath, revalidateTag } from "next/cache";
import { adminButton, AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { HomepageEditor } from "@/components/admin/homepage-editor";

async function saveContact(formData: FormData) {
  "use server";
  const user = await requirePermission("settings.write");
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
  await writeAuditLog({
    actorUserId: user.id,
    action: "settings.contact.update",
    entityType: "settings",
    entityId: "contact",
  });
  revalidateTag("storefront", { expire: 0 });
  revalidatePath("/");
}

async function saveHero(formData: FormData) {
  "use server";
  const user = await requirePermission("settings.write");
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
  await writeAuditLog({
    actorUserId: user.id,
    action: "settings.homepage.update",
    entityType: "settings",
    entityId: "hero",
  });
  revalidateTag("storefront", { expire: 0 });
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
      <AdminSection className="max-w-xl" title="Contact">
      <form action={saveContact} className="space-y-4">
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
      </AdminSection>
      <form action={saveHero} className="space-y-6">
        <HomepageEditor
          title={config.hero.title}
          subtitle={config.hero.subtitle}
          ctaLabel={config.hero.ctaLabel}
          ctaHref={config.hero.ctaHref}
          announcementEnabled={config.announcement.enabled}
          announcementText={config.announcement.text}
        />
      </form>
    </div>
  );
}
