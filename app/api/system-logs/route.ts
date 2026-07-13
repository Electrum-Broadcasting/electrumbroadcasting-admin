import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/env";

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

export async function GET() {
  try {
    // 1. Security audit logs
    const { data: auditLogs, error: auditErr } = await supabase
      .from("security_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (auditErr) {
      console.error("Audit log error:", auditErr);
    }

    // 2. Rate limit events
    const { data: rateLogs, error: rateErr } = await supabase
      .from("rate_limit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (rateErr) {
      console.error("Rate limit error:", rateErr);
    }

    // 3. Normalize audit logs
    const normalizedAudit = (auditLogs ?? []).map((row) => {
  const action = (row.action ?? "").toUpperCase();

  let message = `User ${row.user_id} performed ${action || "UNKNOWN_ACTION"}`;

  if (action.includes("ROLE") && row.old_role && row.new_role) {
    message = `Role changed from ${row.old_role} to ${row.new_role} for user ${row.target_user_id}`;
  }

  if (action.includes("INITIAL") || action.includes("SETUP")) {
    message = `Initial admin setup completed for user ${row.user_id}`;
  }

  return {
    id: row.id,
    severity: "info",
    event_type: action || "AUDIT_EVENT",
    message,
    created_at: row.created_at,
  };
});

    // 4. Normalize rate limit logs
    const normalizedRate = (rateLogs ?? []).map((row) => ({
      id: row.id,
      severity: "warning",
      event_type: row.action ?? "rate_limit",
      message: `Rate limit triggered for user ${row.user_id}`,
      created_at: row.created_at,
    }));

    // 5. Unified feed
    const normalized = [...normalizedAudit, ...normalizedRate];

    return NextResponse.json({ logs: normalized });
  } catch (err) {
    console.error("System logs API failed:", err);
    return NextResponse.json({ logs: [] });
  }
}
