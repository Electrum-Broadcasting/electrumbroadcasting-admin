import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CEOMetrics } from "@/components/admin/CEOMetrics";
import { getAdminContext } from "@/lib/admin/context";

export default async function CEODashboardPage() {
  const supabase = createSupabaseServerClient();

  // Secure authenticated session check (reads the admin_session cookie)
  const { email, role } = await getAdminContext();

  // 1. Last 20 published stories
  const { data: recentStories, error: storiesError } = await supabase
    .from("civic_stories")
    .select("id, title, contributor_display_name, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(20);

  // 2. Last 20 override logs
  const { data: overrideLogs, error: logsError } = await supabase
    .from("admin_override_logs")
    .select("id, action_type, target_type, target_id, created_at, metadata_json")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AdminShell email={email} role={role} title="CEO Dashboard">
      <div className="space-y-6">
        {storiesError || logsError ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            Some dashboard activity could not be loaded. Refresh the page or
            contact support if the problem persists.
          </div>
        ) : null}

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight">Quick Actions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            CEO-level shortcuts coming soon.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold tracking-tight">
            Platform Metrics
          </h2>
          <CEOMetrics />
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold tracking-tight">
            Recent Published Stories
          </h2>
          {recentStories?.length ? (
            <ul className="divide-y divide-border">
              {recentStories.map((story) => (
                <li key={story.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="font-medium">{story.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {story.contributor_display_name ?? "Unknown"}{" "}
                    <span aria-hidden="true">·</span>{" "}
                    {story.published_at
                      ? new Date(story.published_at).toLocaleString()
                      : "Publication date unavailable"}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {storiesError ? "Stories could not be loaded." : "No published stories found."}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold tracking-tight">
            Recent Admin Override Actions
          </h2>
          {overrideLogs?.length ? (
            <ul className="divide-y divide-border">
              {overrideLogs.map((log) => (
                <li key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="font-medium">
                    {log.action_type} — {log.target_type} #{log.target_id}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {logsError ? "Override actions could not be loaded." : "No override actions found."}
            </p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
