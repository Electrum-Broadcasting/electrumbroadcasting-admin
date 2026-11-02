import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/context";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

function parsePage(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : 1;
}

function pageHref(flagsPage: number, signalsPage: number) {
  return `/admin/CEO/safety?flagsPage=${flagsPage}&signalsPage=${signalsPage}`;
}

function Pager({
  page,
  hasNext,
  prevHref,
  nextHref,
}: {
  page: number;
  hasNext: boolean;
  prevHref: string;
  nextHref: string;
}) {
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
      <span>Page {page}</span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={prevHref} className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
            Previous 10
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={nextHref} className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">
            Next 10
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function SafetyPage({
  searchParams,
}: {
  searchParams?: { flagsPage?: string; signalsPage?: string };
}) {
  const admin = await getAdminContext();

  // CEO-only access
  if (!admin || admin.role !== "CEO") {
    redirect("/admin");
  }

  // CEO-gated above; the service client is needed to read the safety tables.
  const supabase = createSupabaseServerClient();
  const flagsPage = parsePage(searchParams?.flagsPage);
  const signalsPage = parsePage(searchParams?.signalsPage);
  const flagsFrom = (flagsPage - 1) * PAGE_SIZE;
  const signalsFrom = (signalsPage - 1) * PAGE_SIZE;

  // 1. Recent moderation events (unified feed)
  const { data: flagRows } = await supabase
    .from("flag_events")
    .select(`
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
    `)
    .order("created_at", { ascending: false })
    .range(flagsFrom, flagsFrom + PAGE_SIZE);

  // 2. Highest-risk contributors
  const { data: riskyContributors } = await supabase
    .from("fraud_contributor_state")
    .select(`
      contributor_id,
      city_id,
      fraud_score,
      fraud_level,
      signal_count,
      last_signal_at,
      user:users!fraud_contributor_state_contributor_id_fkey ( id, email ),
      city:cities ( id, name )
    `)
    .order("fraud_score", { ascending: false })
    .limit(PAGE_SIZE);

  // 3. Recent fraud signals
  const { data: signalRows } = await supabase
    .from("fraud_signals")
    .select(`
      id,
      user_id,
      city_id,
      signal_type,
      signal_value,
      severity,
      score_impact,
      created_at,
      metadata,
      user:users!fraud_signals_user_id_fkey ( id, email ),
      city:cities ( id, name )
    `)
    .order("created_at", { ascending: false })
    .range(signalsFrom, signalsFrom + PAGE_SIZE);

  // Fetched one extra row to know whether a next page exists.
  const recentFlags = flagRows?.slice(0, PAGE_SIZE);
  const flagsHasNext = (flagRows?.length ?? 0) > PAGE_SIZE;
  const signals = signalRows?.slice(0, PAGE_SIZE);
  const signalsHasNext = (signalRows?.length ?? 0) > PAGE_SIZE;

  return (
    <AdminShell email={admin.email} role={admin.role} title="Safety Dashboard">
      <div className="space-y-10">
        <h1 className="text-xl font-semibold text-ink">Safety Dashboard</h1>

        {/* Recent Flags */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Recent Flags</h2>
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Entity</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Reporter</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">City</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentFlags?.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm">
                      {f.entity_type} — {f.target?.[0]?.email ?? f.entity_id}
                    </td>
                    <td className="px-4 py-2 text-sm">{f.reporter?.[0]?.email ?? "Unknown"}</td>
                    <td className="px-4 py-2 text-sm">{f.reason}</td>
                    <td className="px-4 py-2 text-sm">{f.city?.[0]?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(f.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={flagsPage}
            hasNext={flagsHasNext}
            prevHref={pageHref(flagsPage - 1, signalsPage)}
            nextHref={pageHref(flagsPage + 1, signalsPage)}
          />
        </section>

        {/* High-Risk Contributors */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">High-Risk Contributors</h2>
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">User</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">City</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Fraud Score</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {riskyContributors?.map((c) => (
                  <tr key={c.contributor_id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm">{c.user?.[0]?.email ?? c.contributor_id}</td>
                    <td className="px-4 py-2 text-sm">{c.city?.[0]?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{c.fraud_score}</td>
                    <td className="px-4 py-2 text-sm capitalize">{c.fraud_level}</td>
                    <td className="px-4 py-2 text-sm">{c.signal_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Fraud Signals */}
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">Recent Fraud Signals</h2>
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">User</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Severity</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Impact</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {signals?.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm">{s.user?.[0]?.email ?? s.user_id}</td>
                    <td className="px-4 py-2 text-sm">{s.signal_type}</td>
                    <td className="px-4 py-2 text-sm capitalize">{s.severity}</td>
                    <td className="px-4 py-2 text-sm">{s.score_impact}</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={signalsPage}
            hasNext={signalsHasNext}
            prevHref={pageHref(flagsPage, signalsPage - 1)}
            nextHref={pageHref(flagsPage, signalsPage + 1)}
          />
        </section>
      </div>
    </AdminShell>
  );
}
