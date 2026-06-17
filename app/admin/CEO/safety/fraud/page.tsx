import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export default async function FraudSignalsPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServiceClient();

  const { data: signals } = await supabase
    .from("fraud_signals")
    .select(`
      id,
      signal_type,
      signal_value,
      created_at,
      user:users ( id, email ),
      city:cities ( id, name )
    `)
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={email} role={role} title="Fraud Signals">
      <h2 className="text-xl font-semibold text-ink mb-6">Fraud Signals</h2>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">User</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">City</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Value</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {signals?.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2 text-sm">{s.signal_type}</td>
                <td className="px-4 py-2 text-sm">{s.user?.email ?? "Unknown"}</td>
                <td className="px-4 py-2 text-sm">{s.city?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{s.signal_value}</td>
                <td className="px-4 py-2 text-sm">
                  {new Date(s.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  <a
                    href={`/admin/CEO/safety/fraud/${s.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Investigate
                  </a>
                </td>
              </tr>
            ))}

            {signals?.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={6}>
                  No fraud signals detected.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
