import Link from "next/link";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { adminTableNames, adminTables } from "@/lib/admin/config";
import { getTableCount } from "@/lib/admin/data";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { logoutAction } from "@/app/(auth)/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("system_logs")
    .select("id, event_type, severity, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const cards = await Promise.all(
    adminTableNames.map(async (tableName) => {
      const table = adminTables[tableName];
      return {
        label: table.label,
        value: await getTableCount(tableName),
      };
    })
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-ink">Dashboard</h2>
          <p className="mt-2 text-slate-500">
            System status, quick links, and administration modules.
          </p>
        </div>
        <div className="flex gap-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {role}
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
              <p className="text-sm text-slate-500">
                Open {table.label.toLowerCase()} CRUD module
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-ink">System Logs</h3>

        {logs?.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">
            No recent system events.
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {logs?.map((log: any) => (
            <li key={log.id} className="text-sm">
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded border mr-2 ${
                  log.severity === "error"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : log.severity === "warning"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }`}
              >
                {log.severity}
              </span>
              <span className="font-medium">{log.event_type}</span>
              <span className="text-slate-500 ml-2">
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <Link
            href="/admin/platform/system-logs"
            className="text-blue-600 hover:underline text-sm"
          >
            View all system logs →
          </Link>
        </div>
      </section>
    </div>
  );
}
