import { requirePermission } from "@/server/auth/authorize";
import { listCategories } from "@/server/catalog/queries";
import { upsertCategory } from "@/server/catalog/admin";
import { revalidatePath } from "next/cache";
import { adminButton, AdminPageHeader, AdminTable, EmptyState, MobileCards } from "@/components/admin/ui";

async function saveCategory(formData: FormData) {
  "use server";
  await requirePermission("products.write");
  await upsertCategory({
    id: String(formData.get("id") || "") || undefined,
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "") || undefined,
    description: String(formData.get("description") ?? ""),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/categories");
}

export default async function CategoriesPage() {
  await requirePermission("products.write");
  const categories = await listCategories(false);
  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="These tiles feed the shop grid and the hamburger Categories list. Hidden categories do not appear on the storefront."
      />
      {categories.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No categories" body="Add a shop aisle below. Hidden categories stay off the storefront." />
        </div>
      ) : (
        <>
        <MobileCards>
          {categories.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-white/95 p-4 shadow-sm">
              <form action={saveCategory} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="description" value={c.description ?? ""} />
                <label className="block text-sm">
                  Name
                  <input name="name" required defaultValue={c.name} className="input mt-1" />
                </label>
                <label className="block text-sm">
                  Slug
                  <input name="slug" defaultValue={c.slug} className="input mt-1" />
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={c.isActive} /> Visible
                </label>
                <button className={adminButton()} type="submit">
                  Save
                </button>
              </form>
            </li>
          ))}
        </MobileCards>
        <AdminTable className="mt-6">
          <thead>
            <tr className="border-b border-border bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-medium" colSpan={3}>
                Edit category
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 align-top hover:bg-surface">
                <td className="px-4 py-3" colSpan={3}>
                  <form action={saveCategory} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="description" value={c.description ?? ""} />
                    <label className="block min-w-40 flex-1 text-xs">
                      Name
                      <input name="name" required defaultValue={c.name} className="input mt-1" />
                    </label>
                    <label className="block min-w-32 flex-1 text-xs">
                      Slug
                      <input name="slug" defaultValue={c.slug} className="input mt-1" />
                    </label>
                    <label className="flex items-center gap-2 pb-2 text-sm">
                      <input type="checkbox" name="isActive" defaultChecked={c.isActive} /> Visible
                    </label>
                    <button className={adminButton("px-3 py-2")} type="submit">
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        </>
      )}
      <form action={saveCategory} className="mt-8 max-w-md space-y-3 rounded-2xl border border-border bg-background p-5">
        <h2 className="font-serif text-xl">Add category</h2>
        <label className="block text-sm">
          Name
          <input name="name" required className="input mt-1" />
        </label>
        <label className="block text-sm">
          Slug
          <input name="slug" className="input mt-1" />
        </label>
        <label className="block text-sm">
          Description
          <textarea name="description" className="input mt-1" />
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked /> Visible on the store
        </label>
        <button className={adminButton()} type="submit">
          Save
        </button>
      </form>
    </div>
  );
}
