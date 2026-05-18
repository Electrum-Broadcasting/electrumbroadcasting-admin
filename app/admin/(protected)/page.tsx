import Link from "next/link";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { adminTables } from "@/lib/admin/config";
import { getTableCount } from "@/lib/admin/data";
import { getCurrentRole, requireAuthenticatedUser } from "@/lib/admin/auth";
import { logoutAction } from "@/app/(auth)/actions";

export default async function AdminDashboardPage() {
  const user = await requireAuthenticatedUser();
  const role = await getCurrentRole(user.id);

  const cards = await Promise.all(
    Object.values(adminTables).map(async (table) => ({
      label: table.label,
      value: await getTableCount(table.key as keyof typeof adminTables)
    }))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-ink">Dashboard</h2>
          <p className="mt-2 text-slate-500">System status, quick links, and administration modules.</p>
        </div>
        <div className="flex gap-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {role ?? "unassigned"}
          </span>
          <form action={logoutAction}>
            <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <DashboardCards cards={cards} />

      <section>
        <h3 className="text-xl font-semibold text-ink">Quick Links</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.values(adminTables).map((table) => (
            <Link
              key={table.key}
              href={table.route}
              className="rounded-lg border border-slate-200 bg-paper p-4 transition hover:border-accent"
            >
              <p className="font-semibold text-ink">{table.label}</p>
              <p className="text-sm text-slate-500">Open {table.label.toLowerCase()} CRUD module</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
