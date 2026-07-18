import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CEOMetrics } from "@/components/admin/CEOMetrics";
import { redirect } from "next/navigation";

export default async function CEODashboardPage() {
  const supabase = createSupabaseServerClient();

  // ⭐ Secure authenticated session check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return redirect("/login?error=Session expired");
  }

  const user = authData.user;
  const email = user.email ?? null;

  // Load admin_users.role
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_uid", user.id)
    .single();

  const role = adminUser?.role ?? "UNKNOWN";

  // 1. Last 20 published stories
  const { data: recentStories } = await supabase
    .from("civic_stories")
    .select("id, title, contributor_display_name, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(20);

  // 2. Last 20 override logs
  const { data: overrideLogs } = await supabase
    .from("admin_override_logs")
    .select("id, action_type, target_type, target_id, created_at, metadata_json")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AdminShell email={email} role={role} title="CEO Dashboard">
      <div className="space-y-12">

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Quick Actions</h2>
          <p className="text-sm text-slate-500">CEO-level shortcuts coming soon.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Platform Metrics</h2>
          <CEOMetrics />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Recent Published Stories</h2>
          <ul className="space-y-2">
            {recentStories?.map((s) => (
              <li key={s.id} className="border-b border-gray-200 pb-2">
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-gray-500">
                  {s.contributor_display_name ?? "Unknown"} — {s.published_at}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Recent Admin Override Actions</h2>
          <ul className="space-y-2">
            {overrideLogs?.map((log) => (
              <li key={log.id} className="border-b border-gray-200 pb-2">
                <div className="font-medium">
                  {log.action_type} — {log.target_type} #{log.target_id}
                </div>
                <div className="text-sm text-gray-500">{log.created_at}</div>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </AdminShell>
  );
}
