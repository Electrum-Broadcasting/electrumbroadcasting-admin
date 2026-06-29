import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ModerationQueuePage() {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: queue } = await supabase
    .from("moderation_queue")
    .select(`
      id,
      content_type,
      content_id,
      reason,
      status,
      created_at,
      city:cities ( id, name )
    `)
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={email} role={role} title="Moderation Queue">
      <h2 className="text-xl font-semibold text-ink mb-6">Moderation Queue</h2>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Content ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Reason</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">City</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Created</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {queue?.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2 text-sm">{item.content_type}</td>
                <td className="px-4 py-2 text-sm">{item.content_id}</td>
                <td className="px-4 py-2 text-sm">{item.reason}</td>
                <td className="px-4 py-2 text-sm">{item.city?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm capitalize">{item.status}</td>
                <td className="px-4 py-2 text-sm">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  <a
                    href={`/admin/CEO/safety/moderation/${item.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Review
                  </a>
                </td>
              </tr>
            ))}

            {queue?.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={7}>
                  No items in the moderation queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
