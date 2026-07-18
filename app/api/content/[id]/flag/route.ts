import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const contentId = params.id;

  const { reason } = await req.json();

  // ⭐ 1. Auth — secure session check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = authData.user;

  // 2. Fetch content
  const { data: content, error: contentError } = await supabase
    .from("content_items")
    .select("id, city_id, content_type, contributor_id")
    .eq("id", contentId)
    .single();

  if (contentError || !content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // 3. Insert flag event
  const { data: flagEvent, error: flagError } = await supabase
    .from("flag_events")
    .insert({
      entity_type: "content",
      entity_id: contentId,
      user_id: user.id,
      city_id: content.city_id,
      reason,
      metadata: { content_type: content.content_type },
    })
    .select()
    .single();

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 400 });
  }

  // 4. Count total flags for this content
  const { count: flagCount } = await supabase
    .from("flag_events")
    .select("*", { count: "exact", head: true })
    .eq("entity_id", contentId)
    .eq("entity_type", "content");

  // 5. Fraud signal: flag spike (3 flags in 24 hours)
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { count: recentFlags } = await supabase
    .from("flag_events")
    .select("*", { count: "exact", head: true })
    .eq("entity_id", contentId)
    .gte("created_at", since);

  if ((recentFlags ?? 0) >= 3) {
    await supabase.from("fraud_signals").insert({
      user_id: content.contributor_id,
      city_id: content.city_id,
      signal_type: "flag_spike",
      signal_value: recentFlags,
      severity: "high",
      score_impact: 3,
      metadata: { content_id: contentId },
      reviewed: false,
    });
  }

  // 6. Audit log
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "flag_content",
    entity_type: "content",
    entity_id: contentId,
    metadata: { reason },
  });

  return NextResponse.json({ success: true, flagCount });
}
