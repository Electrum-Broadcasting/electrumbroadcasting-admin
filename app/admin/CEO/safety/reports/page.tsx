import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export default async function SafetyReportsListPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServiceClient();

  const { data: reports } = await supabase
    .from("safety_reports")
    .select(`
      id,
      category,
      status,
      created_at,
      reporter:reported_by ( id, email ),
      target:reported_user ( id, email ),
      city:cities ( id, name )
    `)
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={email} role={role} title="Safety Reports">
      <h2 className="text-xl font-semibold text-ink mb-6">Safety Reports</h2>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Reported User</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Reporter</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Category</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">City</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Created</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {reports?.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2 text-sm">{r.target?.email ?? "Unknown"}</td>
                <td className="px-4 py-2 text-sm">{r.reporter?.email ?? "Unknown"}</td>
                <td className="px-4 py-2 text-sm">{r.category}</td>
                <td className="px-4 py-2 text-sm">{r.city?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm capitalize">{r.status}</td>
                <td className="px-4 py-2 text-sm">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  <a
                    href={`/admin/CEO/safety/reports/${r.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}

            {reports?.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={7}>
                  No safety reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
