import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_override_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  // Your UI expects admin_name, but your schema does not have it.
  // We return null for now.
  const rows = data.map((log) => ({
    id: log.id,
    created_at: log.created_at,
    admin_name: null,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id,
  }));

  return NextResponse.json(rows);
}
