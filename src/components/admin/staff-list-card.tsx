import Link from "next/link";
import { setStaffActiveAction } from "@/app/admin/users/actions";
import { adminButton, staffJobLabel, StatusPill } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import type { StaffListItem } from "@/server/auth/staff";

function JobLine({ person }: { person: StaffListItem }) {
  const jobs = person.roles.map(staffJobLabel).join(", ");
  return <p className="text-sm text-muted">{jobs || "No job yet"}</p>;
}

export function StaffListCard({
  person,
  canBlock,
}: {
  person: StaffListItem;
  canBlock: boolean;
}) {
  return (
    <article className="admin-panel space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl leading-tight">{person.fullName}</p>
          <a href={`mailto:${person.email}`} className="mt-1 block text-sm text-accent">
            {person.email}
          </a>
        </div>
        <StatusPill value={person.isActive ? "Can sign in" : "Blocked"} tone={person.isActive ? "ok" : "muted"} />
      </header>
      <JobLine person={person} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href={`/admin/users/${person.id}`} className={adminButton()}>
          Open this person
        </Link>
        {canBlock ? (
          <form action={setStaffActiveAction}>
            <input type="hidden" name="userId" value={person.id} />
            <input type="hidden" name="active" value={person.isActive ? "false" : "true"} />
            <button type="submit" className={buttonClass("secondary", "h-12 min-h-12 w-full sm:w-auto")}>
              {person.isActive ? "Block" : "Allow"}
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}

export function StaffTableRow({
  person,
  canBlock,
}: {
  person: StaffListItem;
  canBlock: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0 align-top hover:bg-surface">
      <td className="px-4 py-3 font-medium">{person.fullName}</td>
      <td className="px-4 py-3">
        <a href={`mailto:${person.email}`} className="text-accent">
          {person.email}
        </a>
      </td>
      <td className="px-4 py-3">{person.roles.map(staffJobLabel).join(", ") || "—"}</td>
      <td className="px-4 py-3">
        <StatusPill value={person.isActive ? "Can sign in" : "Blocked"} tone={person.isActive ? "ok" : "muted"} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <Link href={`/admin/users/${person.id}`} className={adminButton("h-11 min-h-11 px-4")}>
            Open this person
          </Link>
          {canBlock ? (
            <form action={setStaffActiveAction}>
              <input type="hidden" name="userId" value={person.id} />
              <input type="hidden" name="active" value={person.isActive ? "false" : "true"} />
              <button type="submit" className={buttonClass("secondary", "h-11 min-h-11 px-4")}>
                {person.isActive ? "Block" : "Allow"}
              </button>
            </form>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
