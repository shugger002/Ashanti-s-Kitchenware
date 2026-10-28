import { adminButton } from "@/components/admin/ui";
import { addStaffUser } from "@/app/admin/users/actions";

export function InviteStaffForm({ error }: { error?: string }) {
  return (
    <form action={addStaffUser} className="max-w-md admin-panel space-y-3">
      <h2 className="font-serif text-xl">New staff login</h2>
      {error === "email" ? (
        <p className="text-sm text-accent">That email already has a desk login.</p>
      ) : null}
      <label className="block text-sm">
        Name
        <input name="fullName" required className="input mt-1" />
      </label>
      <label className="block text-sm">
        Email
        <input name="email" type="email" required className="input mt-1" />
      </label>
      <label className="block text-sm">
        Password
        <span className="mt-0.5 block text-xs text-muted">At least 12 characters.</span>
        <input name="password" type="password" required minLength={12} className="input mt-1" />
      </label>
      <label className="block text-sm">
        Job
        <select name="role" className="input mt-1">
          <option value="store_admin">Runs the shop desk</option>
          <option value="inventory_manager">Looks after stock</option>
          <option value="order_manager">Looks after orders</option>
          <option value="super_admin">Store owner (full access)</option>
        </select>
      </label>
      <button className={adminButton()} type="submit">
        Create login
      </button>
    </form>
  );
}
