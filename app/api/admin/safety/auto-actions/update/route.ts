import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // ⭐ service_role client (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const body = await req.json();
  const { action, deleteId, toggleId, toggleValue } = body;

  // ⭐ DELETE
  if (deleteId) {
    const { error } = await supabase
      .from("auto_actions")
      .delete()
      .eq("id", deleteId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ⭐ TOGGLE ENABLED
  if (toggleId !== undefined && toggleValue !== undefined) {
    const { error } = await supabase
      .from("auto_actions")
      .update({ enabled: toggleValue })
      .eq("id", toggleId);

    if (error) {
      console.error("Toggle error:", error);
      return NextResponse.json({ error: "Toggle failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ⭐ INSERT NEW AUTO-ACTION
  if (action) {
    const { error } = await supabase.from("auto_actions").insert({
      trigger_type: action.trigger_type,
      trigger_id: action.trigger_id,
      action_type: action.action_type,
      scope_city_id: action.scope_city_id,
      scope_category: action.scope_category,
      enabled: action.enabled,
    });

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}
