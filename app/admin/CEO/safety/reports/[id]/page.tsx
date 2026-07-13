import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabasePublicClient } from "@/lib/supabase/server";

export default async function SafetyReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabasePublicClient();

  // Unified moderation query: load the flag event + reporter + target + city
  const { data: report, error } = await supabase
    .from("flag_events")
    .select(
      `
      id,
      entity_type,
      entity_id,
      reason,
      user_id,
      created_at,
      metadata,
      reporter:users!flag_events_user_id_fkey ( id, email ),
      target:users!flag_events_entity_id_fkey ( id, email ),
      city:cities ( id, name )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !report) {
    return (
      <AdminShell email={email} role={role} title="Report Not Found">
        <p className="text-slate-500 text-sm">This safety report does not exist.</p>
      </AdminShell>
    );
  }

  // Legacy fields preserved in metadata
  const category = report.metadata?.legacy_category ?? "—";
  const status = report.metadata?.legacy_status ?? "open";
  const description = report.metadata?.legacy_description ?? report.reason;

  return (
    <AdminShell email={email} role={role} title="Safety Report">
      <h2 className="text-xl font-semibold text-ink mb-6">Safety Report</h2>

      {/* Report Metadata */}
      <div className="rounded-lg border border-slate-200 p-6 mb-10 bg-white">
        <h3 className="text-lg font-semibold text-ink mb-4">Report Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Detail label="Reported User" value={report.target?.[0]?.email ?? "Unknown"} />
          <Detail label="Reporter" value={report.reporter?.[0]?.email ?? "Unknown"} />
          <Detail label="City" value={report.city?.[0]?.name ?? "—"} />
          <Detail label="Category" value={category} />
          <Detail label="Status" value={status} />
          <Detail
            label="Created"
            value={new Date(report.created_at).toLocaleString()}
          />
        </div>

        {/* Description */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Description</h4>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">
            {description ?? "No description provided."}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-lg border border-slate-200 p-6 bg-white">
        <h3 className="text-lg font-semibold text-ink mb-4">Actions</h3>

        <div className="flex flex-wrap gap-4">
          <ActionButton
            label="Mark Resolved"
            action="resolve"
            reportId={report.id}
          />
          <ActionButton
            label="Escalate"
            action="escalate"
            reportId={report.id}
          />
          <ActionButton
            label="Add Note"
            action="note"
            reportId={report.id}
          />
          <ActionButton
            label="Suspend User"
            action="suspend"
            reportId={report.id}
          />
          <ActionButton
            label="Freeze City"
            action="freeze"
            reportId={report.id}
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

function ActionButton({ label, action, reportId }: any) {
  return (
    <form action={`/api/admin/safety/reports/${reportId}/${action}`} method="post">
      <button
        type="submit"
        className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {label}
      </button>
    </form>
  );
}
