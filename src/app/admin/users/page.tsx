import Link from "next/link";
import { requirePermission } from "@/server/auth/authorize";
import { canShowBlock, countStaffGlance, listStaff, type StaffNeedFilter } from "@/server/auth/staff";
import { StaffListCard, StaffTableRow } from "@/components/admin/staff-list-card";
import {
  adminButton,
  AdminGlance,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  MobileCards,
  Toolbar,
} from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function parseNeed(value?: string): StaffNeedFilter | "" {
  return value === "on" || value === "pack" || value === "paid" || value === "stock" || value === "blocked" || value === "all"
    ? value
    : "";
}

function listHref(opts: { q?: string; need?: string }) {
  const params = new URLSearchParams();
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.need) params.set("need", opts.need);
  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; need?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  const searching = Boolean(q?.trim());
  const needParam = parseNeed(params.need);
  const need: StaffNeedFilter | undefined = needParam || (searching ? undefined : "on");
  const [actor, people, glance] = await Promise.all([
    requirePermission("users.write"),
    listStaff({ q, need }),
    countStaffGlance(),
  ]);
  const blockFlags = await Promise.all(people.map((person) => canShowBlock(person, actor.id)));
  const filtered = Boolean(searching || needParam);
  const onDeskActive = need === "on" && !searching;
  const chips: { href: string; label: string; active: boolean }[] = [
    { href: listHref({ q, need: "on" }), label: "On the desk", active: onDeskActive },
    { href: listHref({ q, need: "pack" }), label: "Can pack", active: need === "pack" },
    { href: listHref({ q, need: "paid" }), label: "Can mark paid", active: need === "paid" },
    { href: listHref({ q, need: "stock" }), label: "Stock", active: need === "stock" },
    { href: listHref({ q, need: "blocked" }), label: "Blocked", active: need === "blocked" },
    { href: listHref({ q, need: "all" }), label: "Everyone", active: need === "all" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Staff"
        description="People who can open this desk. Only the store owner can add or change them. Keep at least one owner who can sign in."
        action={
          <Link href="/admin/users/new" className={adminButton()}>
            Add staff
          </Link>
        }
      />
      <AdminGlance
        items={[
          { href: "/admin/users", label: "On the desk", value: glance.onDesk, warn: glance.onDesk === 0 },
          { href: "/admin/users?need=blocked", label: "Blocked", value: glance.blocked, warn: glance.blocked > 0 },
          { href: "/admin/users?need=pack", label: "Can pack", value: glance.pack },
          { href: "/admin/users?need=paid", label: "Can mark paid", value: glance.paid },
        ]}
      />
      <Toolbar>
        <form className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" method="get">
          <label htmlFor="staff-q" className="sr-only">
            Search staff
          </label>
          <input
            id="staff-q"
            name="q"
            defaultValue={params.q}
            placeholder="Name or email"
            className="input w-full sm:max-w-sm"
          />
          <button className={adminButton()} type="submit">
            Search
          </button>
          {filtered ? (
            <Link href="/admin/users" className="inline-flex h-12 items-center text-sm text-muted hover:text-foreground">
              Clear
            </Link>
          ) : null}
        </form>
      </Toolbar>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              buttonClass("ghost", "h-10 min-h-10 px-3 text-sm"),
              chip.active && "bg-foreground text-background hover:bg-foreground",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>
      {people.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={filtered ? "No matching staff" : "No staff yet"}
            body={filtered ? "Clear a filter or try another name or email." : "Add a login so someone can pack, restock, or mark paid."}
          />
        </div>
      ) : (
        <>
          <MobileCards>
            {people.map((person, index) => (
              <li key={person.id}>
                <StaffListCard person={person} canBlock={blockFlags[index] ?? false} />
              </li>
            ))}
          </MobileCards>
          <AdminTable className="mt-4">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Sign in</th>
                <th className="px-4 py-3 font-medium">Person</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person, index) => (
                <StaffTableRow key={person.id} person={person} canBlock={blockFlags[index] ?? false} />
              ))}
            </tbody>
          </AdminTable>
        </>
      )}
    </div>
  );
}
