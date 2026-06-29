import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CitiesTable  } from "@/components/admin/cities/CitiesTable";

export default async function CEOCitiesPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const email = session.user.email ?? null;

  // Load canonical admin role (uppercase) from admin_users
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  const role = adminUser?.role ?? "UNKNOWN";

  return (
    <AdminShell email={email} role={role} title="Cities">
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">
            Manage Cities
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            View and manage all cities across the Electrum platform.
          </p>

          <CitiesTable />
        </section>
      </div>
    </AdminShell>
  );
}
