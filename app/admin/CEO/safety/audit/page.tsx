import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditLog = {
  id: string;
  actor: string | null;
  action: string;
  entity: string | null;
  metadata: any | null;
  created_at: string;
};

export default async function AuditLogsListPage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, actor, action, entity, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<AuditLog[]>();

  return (
    <AdminShell email={email} role={role} title="Audit Logs">
      <h2 className="text-xl font-semibold text-ink mb-6">Audit Logs</h2>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Action</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Entity</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Metadata</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2 text-sm">{log.actor}</td>
                <td className="px-4 py-2 text-sm">{log.action}</td>
                <td className="px-4 py-2 text-sm">{log.entity}</td>
                <td className="px-4 py-2 text-sm">
                  {log.metadata ? (
                    <pre className="text-xs bg-slate-100 p-2 rounded border overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {logs?.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
