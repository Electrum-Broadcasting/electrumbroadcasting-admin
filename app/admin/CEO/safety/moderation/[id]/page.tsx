import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabasePublicClient } from "@/lib/supabase/server";

export default async function ModerationItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabasePublicClient();

  const { data: item, error } = await supabase
    .from("moderation_queue")
    .select(
      `
      id,
      content_type,
      content_id,
      reason,
      status,
      created_at,
      city:cities ( id, name )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !item) {
    return (
      <AdminShell email={email} role={role} title="Moderation Item Not Found">
        <p className="text-slate-500 text-sm">This moderation item does not exist.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell email={email} role={role} title="Moderation Review">
      <h2 className="text-xl font-semibold text-ink mb-6">Moderation Review</h2>

      {/* Metadata */}
      <div className="rounded-lg border border-slate-200 p-6 mb-10 bg-white">
        <h3 className="text-lg font-semibold text-ink mb-4">Item Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Detail label="Content Type" value={item.content_type} />
          <Detail label="Content ID" value={item.content_id} />
          <Detail label="Reason" value={item.reason} />
          <Detail label="City" value={item.city?.[0]?.name ?? "—"} />
          <Detail label="Status" value={item.status} />
          <Detail
            label="Created"
            value={new Date(item.created_at).toLocaleString()}
          />
        </div>
      </div>

      {/* Content Preview */}
      <div className="rounded-lg border border-slate-200 p-6 mb-10 bg-white">
        <h3 className="text-lg font-semibold text-ink mb-4">Content Preview</h3>
        <p className="text-sm text-slate-600">
          A preview of this content type will appear here in a future update.
        </p>
      </div>

      {/* Actions */}
      <div className="rounded-lg border border-slate-200 p-6 bg-white">
        <h3 className="text-lg font-semibold text-ink mb-4">Actions</h3>

        <div className="flex flex-wrap gap-4">
          <ActionButton
            label="Approve"
            action="approve"
            itemId={item.id}
          />
          <ActionButton
            label="Reject"
            action="reject"
            itemId={item.id}
          />
          <ActionButton
            label="Escalate"
            action="escalate"
            itemId={item.id}
          />
        </div>
      </div>
    </AdminShell>
  );
}

function Detail({ label, value }: any) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}

function ActionButton({ label, action, itemId }: any) {
  return (
    <form action={`/api/admin/safety/moderation/${itemId}/${action}`} method="post">
      <button
        type="submit"
        className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {label}
      </button>
    </form>
  );
}
