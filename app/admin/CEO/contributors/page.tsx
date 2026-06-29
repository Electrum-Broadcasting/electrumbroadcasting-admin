import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CEOContributorsPanel } from "@/components/admin/CEO/contributors/ContributorsPanel";

export default async function CEOContributorsPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const email = session.user.email ?? null;
const { data: adminUser } = await supabase
  .from("admin_users")
  .select("role")
  .eq("user_id", session.user.id)
  .single();

const role = adminUser?.role ?? "UNKNOWN";

  return (
    <AdminShell email={email} role={role} title="Contributors">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">
            Manage Contributors
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            View and manage all contributors across all cities.
          </p>

          <CEOContributorsPanel />
        </section>
      </div>
    </AdminShell>
  );
}
