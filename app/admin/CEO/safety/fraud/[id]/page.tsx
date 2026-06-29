import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FraudSignal = {
  id: string;
  user_id: string;
  city_id: string;
  signal_type: string;
  signal_value: number;
  metadata: any | null;
  created_at: string;
   user: {
    id: string;
    email: string;
    display_name: string;
  } | null;
  city: {
    id: string;
    name: string;
  } | null;
};

export default async function FraudSignalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { email, role } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const { data: signal, error } = await supabase
  .from("fraud_signals")
  .select(`
    id,
    user_id,
    city_id,
    signal_type,
    signal_value,
    metadata,
    created_at,
    user:contributors!inner (
      id,
      email,
      display_name
    ),
    city:cities!inner (
      id,
      name
    )
  `)
  .eq("id", params.id)
  .single<FraudSignal>();

  if (error || !signal) {
    return (
      <AdminShell email={email} role={role} title="Fraud Signal Not Found">
        <p className="text-slate-500 text-sm">This fraud signal does not exist.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell email={email} role={role} title="Fraud Signal">
      <h2 className="text-xl font-semibold text-ink mb-6">Fraud Signal</h2>

      <div className="rounded-lg border border-slate-200 p-6 mb-10 bg-white">
        <h3 className="text-lg font-semibold text-ink mb-4">Signal Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Detail label="Signal Type" value={signal.signal_type} />
          <Detail label="Value" value={signal.signal_value} />
          <Detail label="User" value={signal.user?.display_name ?? "Unknown"} />
          <Detail label="City" value={signal.city?.name ?? "—"} />
          <Detail
            label="Detected"
            value={new Date(signal.created_at).toLocaleString()}
          />
        </div>

        {signal.metadata && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Metadata</h4>
            <pre className="text-xs bg-slate-100 p-3 rounded border overflow-x-auto">
              {JSON.stringify(signal.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 p-6 bg-white">
        <h3 className="text-lg font-semibold text-ink mb-4">Actions</h3>

        <div className="flex flex-wrap gap-4">
          <ActionButton
            label="Mark Reviewed"
            action="review"
            signalId={signal.id}
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

function ActionButton({ label, action, signalId }: any) {
  return (
    <form action={`/api/admin/safety/fraud/${signalId}/${action}`} method="post">
      <button
        type="submit"
        className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {label}
      </button>
    </form>
  );
}
