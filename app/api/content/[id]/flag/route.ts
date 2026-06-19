import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { runAutoActions } from "@/lib/safety/autoActions/runAutoActions";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServiceClient();
  const contentId = params.id;

  const { reason } = await req.json();

  // 1. Auth
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. Fetch content
  const { data: content, error: contentError } = await supabase
    .from("content_items")
    .select("id, city_id, content_type")
    .eq("id", contentId)
    .single();

  if (contentError || !content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // 3. Insert flag
  const { data: insertedFlagEvent, error: flagError } = await supabase
    .from("flag_events")
    .insert({
      content_item_id: contentId,
      user_id: user.id,
      city_id: content.city_id,
      reason,
    })
    .select()
    .single();

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 400 });
  }

  // 4. Auto-actions
  await runAutoActions(insertedFlagEvent);

  // 5. Count flags
  const { count: flagCount } = await supabase
    .from("flag_events")
    .select("*", { count: "exact", head: true })
    .eq("content_item_id", contentId);

  // 6. Fetch rules
  const { data: rules } = await supabase
    .from("moderation_rules")
    .select("*")
    .eq("city_id", content.city_id);

  // 7. Evaluate rules (FIXED implicit-any)
  const triggeredRules = rules.filter(
    (rule: any) => flagCount >= rule.flag_threshold
  );

  // 8. Escalate
  if (triggeredRules.length > 0) {
    const rule = triggeredRules[0];

    await supabase.from("moderation_queue").insert({
      city_id: content.city_id,
      content_type: content.content_type,
      content_id: contentId,
      reason: `Rule triggered: ${rule.name}`,
      status: "pending",
    });

    await supabase.from("moderation_events").insert({
      content_item_id: contentId,
      moderator_user_id: null,
      event_type: "auto_escalate",
      reason: `Triggered rule: ${rule.name}`,
      metadata_json: { rule_id: rule.id, flag_count: flagCount },
    });
  }

  return NextResponse.json({ success: true, flagCount });
}
