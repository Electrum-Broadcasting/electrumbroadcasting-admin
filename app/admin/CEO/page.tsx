import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { CEOMetrics } from "@/components/admin/CEOMetrics";

export default async function CEODashboardPage() {
  const { email } = await getAdminContext();

const supabase = createSupabaseServiceClient();

const { data: logs } = await supabase
  .from("system_logs")
  .select("id, event_type, severity, created_at")
  .order("created_at", { ascending: false })
  .limit(5);

  return (
    <AdminShell email={email} role="CEO" title="CEO Dashboard">
      <div className="space-y-8">

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <a
              href="/admin/CEO/users/new"
              className="rounded-lg border border-slate-300 p-4 hover:bg-slate-50 transition"
            >
              <h3 className="font-medium text-ink">Create New User</h3>
              <p className="text-sm text-slate-600">Add a new city_admin or editor.</p>
            </a>

            <a
              href="/admin/CEO/users"
              className="rounded-lg border border-slate-300 p-4 hover:bg-slate-50 transition"
            >
              <h3 className="font-medium text-ink">View All Users</h3>
              <p className="text-sm text-slate-600">Manage platform administrators.</p>
            </a>

            <a
              href="/admin/CEO/cities"
              className="rounded-lg border border-slate-300 p-4 hover:bg-slate-50 transition"
            >
              <h3 className="font-medium text-ink">Manage Cities</h3>
              <p className="text-sm text-slate-600">Assign city_admins and configure cities.</p>
            </a>

          </div>
        </section>

        {/* Overview */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Platform Overview</h2>
          <p className="text-sm text-slate-600">
            Use the CEO Dashboard to manage users, cities, and global platform settings.
          </p>
        </section>
        </div>



{/* Platform Metrics */}
<section>
  <h2 className="text-lg font-semibold text-ink mb-3">Platform Metrics</h2>
  <CEOMetrics />
</section>

        {/* System Logs Preview */}
<section>
  <h2 className="text-lg font-semibold text-ink mb-3">System Logs</h2>

  {logs?.length === 0 && (
    <p className="text-sm text-slate-500">No recent system events.</p>
  )}

  <ul className="mt-4 space-y-3">
    {logs?.map((log) => (
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
    <a
      href="/admin/platform/system-logs"
      className="text-blue-600 hover:underline text-sm"
    >
      View all system logs →
    </a>
  </div>
</section>

    </AdminShell>
  );
}
