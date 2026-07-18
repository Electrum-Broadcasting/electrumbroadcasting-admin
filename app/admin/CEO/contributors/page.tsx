import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CEOContributorsPanel } from "@/components/admin/CEO/contributors/ContributorsPanel";
import { redirect } from "next/navigation";

export default async function CEOContributorsPage() {
  const supabase = createSupabaseServerClient();

  // ⭐ Secure authenticated session check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return redirect("/login?error=Session expired");
  }

  const user = authData.user;
  const email = user.email ?? null;

  // Load canonical admin role (uppercase) from admin_users
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_uid", user.id)
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
