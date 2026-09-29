import { AdminShell } from "@/components/admin/AdminShell";
import { CEOContributorsPanel } from "@/components/admin/CEO/contributors/ContributorsPanel";
import { getAdminContext } from "@/lib/admin/context";

export default async function CEOContributorsPage() {
  // Secure authenticated session check (reads the admin_session cookie)
  const { email, role } = await getAdminContext();

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
