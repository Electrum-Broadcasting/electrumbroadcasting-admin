import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Validate UUID format
function isValidUUID(value: any) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const body = await req.json();

  const rules = body.moderation_rules;

  if (!Array.isArray(rules)) {
    return NextResponse.json(
      { error: "Invalid payload: moderation_rules must be an array" },
      { status: 400 }
    );
  }

  // Separate rules into updates (real UUID) and inserts (temp IDs)
  const updateRules = rules.filter((r) => isValidUUID(r.id));
  const insertRules = rules.filter((r) => !isValidUUID(r.id));

  // 1. Load existing rule IDs
  const { data: existing, error: existingError } = await supabase
    .from("moderation_rules")
    .select("id, label, description, severity, applies_to, enabled, trigger_type, trigger_value");


  if (existingError) {
    console.error(existingError);
    return NextResponse.json(
      { error: "Failed to load existing moderation rules" },
      { status: 500 }
    );
  }

  const existingIds = new Set(existing.map((r) => r.id));
  const incomingRealIds = new Set(updateRules.map((r) => r.id));

  // 2. DELETE rules removed in the UI
  const idsToDelete = [...existingIds].filter(
    (id) => !incomingRealIds.has(id)
  );

  if (idsToDelete.length > 0) {
    const { error } = await supabase
      .from("moderation_rules")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to delete removed moderation rules" },
        { status: 500 }
      );
    }
  }

  // 3. UPDATE existing rules
  for (const r of updateRules) {
    const { error } = await supabase
      .from("moderation_rules")
      .update({
        label: r.label,
        description: r.description ?? "",
        severity: r.severity,
        applies_to: r.applies_to,
        trigger_type: r.trigger_type,
        trigger_value: r.trigger_value, 
        enabled: r.enabled ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to update moderation rule" },
        { status: 500 }
      );
    }
  }

  // 4. INSERT new rules (no ID → SQL generates UUID)
  if (insertRules.length > 0) {
    const insertPayload = insertRules.map((r) => ({
      label: r.label,
      description: r.description ?? "",
      severity: r.severity,
      applies_to: r.applies_to,
      enabled: r.enabled ?? true,
      trigger_type: r.trigger_type,
      trigger_value: r.trigger_value, 
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("moderation_rules")
      .insert(insertPayload);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to insert new moderation rules" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
