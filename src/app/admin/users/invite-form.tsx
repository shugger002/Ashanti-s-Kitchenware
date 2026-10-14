import { adminButton } from "@/components/admin/ui";
import { addStaffUser } from "@/app/admin/users/actions";

export function InviteStaffForm() {
  return (
    <form action={addStaffUser} className="max-w-md space-y-3 rounded-2xl border border-border bg-background p-5">
      <h2 className="font-serif text-xl">Invite staff</h2>
      <label className="block text-sm">
        Name
        <input name="fullName" required className="input mt-1" />
      </label>
      <label className="block text-sm">
        Email
        <input name="email" type="email" required className="input mt-1" />
      </label>
      <label className="block text-sm">
        Password (12+ characters)
        <input name="password" type="password" required minLength={12} className="input mt-1" />
      </label>
      <label className="block text-sm">
        Role
        <select name="role" className="input mt-1">
          <option value="store_admin">Store administrator</option>
          <option value="inventory_manager">Inventory manager</option>
          <option value="order_manager">Order manager</option>
          <option value="super_admin">Super administrator</option>
        </select>
      </label>
      <button className={adminButton()} type="submit">
        Create
      </button>
    </form>
  );
}
