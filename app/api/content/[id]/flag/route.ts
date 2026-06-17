import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { runAutoActions } from "@/lib/safety/autoActions/runAutoActions";

await runAutoActions(insertedFlagEvent);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const contentId = params.id;

  const { reason } = await req.json();

  // 1. Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. Fetch content to get city_id + type
  const { data: content, error: contentError } = await supabase
    .from("content_items")
    .select("id, city_id, content_type")
    .eq("id", contentId)
    .single();

  if (contentError || !content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // 3. Insert into flag_events
  const { error: flagError } = await supabase.from("flag_events").insert({
    content_item_id: contentId,
    user_id: user.id,
    city_id: content.city_id,
    reason,
  });

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 400 });
  }

  // 4. Count total flags for this content
  const { count: flagCount } = await supabase
    .from("flag_events")
    .select("*", { count: "exact", head: true })
    .eq("content_item_id", contentId);

  // 5. Fetch moderation rules for this city
  const { data: rules } = await supabase
    .from("moderation_rules")
    .select("*")
    .eq("city_id", content.city_id);

  // 6. Evaluate rules
  const triggeredRules = rules.filter((rule) => {
    return flagCount >= rule.flag_threshold;
  });

  // 7. If any rules triggered, insert into moderation_queue
  if (triggeredRules.length > 0) {
    const rule = triggeredRules[0]; // first matching rule

    await supabase.from("moderation_queue").insert({
      city_id: content.city_id,
      content_type: content.content_type,
      content_id: contentId,
      reason: `Rule triggered: ${rule.name}`,
      status: "pending",
    });

    // 8. Log moderation event
    await supabase.from("moderation_events").insert({
      content_item_id: contentId,
      moderator_user_id: null, // system action
      event_type: "auto_escalate",
      reason: `Triggered rule: ${rule.name}`,
      metadata_json: { rule_id: rule.id, flag_count: flagCount },
    });
  }

  return NextResponse.json({ success: true, flagCount });
}
