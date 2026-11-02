import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminContext } from "@/lib/admin/context";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const PAGE_SIZE_MAX = 100;

function validDate(value: string | null) {
  return !value || !Number.isNaN(Date.parse(value));
}

export async function GET(request: Request) {
  const admin = await getAdminContext();
  if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "25");
  const domain = params.get("domain")?.trim() ?? "";
  const eventType = params.get("eventType")?.trim() ?? "";
  const from = params.get("from");
  const to = params.get("to");

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 1000 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > PAGE_SIZE_MAX ||
    !validDate(from) ||
    !validDate(to) ||
    !/^[A-Za-z0-9_.-]*$/.test(domain) ||
    !/^[A-Za-z0-9_.-]*$/.test(eventType)
  ) {
    return NextResponse.json(
      { error: "Invalid log filters or pagination" },
      { status: 400 }
    );
  }

  try {
    // admin_action_logs is not readable by authenticated users; CEO views read it with the service role.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const start = (page - 1) * pageSize;
    let query = supabase
      .from("admin_action_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, start + pageSize - 1);
    if (domain) query = query.eq("domain", domain);
    if (eventType) query = query.ilike("action", `%${eventType}%`);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, count, error } = await query;
    if (error) {
      console.error("Failed to load admin_action_logs:", error);
      return NextResponse.json(
        { error: "Failed to load system logs" },
        { status: 500 }
      );
    }

    const logs = (data ?? []).map((row) => ({
      ...row,
      event_type: row.action,
      message: [
        row.actor_role,
        row.entity_type && `${row.entity_type}${row.entity_id ? ` ${row.entity_id}` : ""}`,
      ]
        .filter(Boolean)
        .join(" · "),
    }));

    return NextResponse.json({ logs, total: count ?? 0, page, pageSize });
  } catch (error) {
    console.error("System logs request failed:", error);
    return NextResponse.json(
      { error: "Failed to load system logs" },
      { status: 500 }
    );
  }
}
