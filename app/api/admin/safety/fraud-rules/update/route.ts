import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const body = await req.json();
  const rules = body.rules;

  if (!Array.isArray(rules)) {
    return NextResponse.json(
      { error: "Invalid payload: rules must be an array" },
      { status: 400 }
    );
  }

  // Separate new vs existing
  const updateRules = rules.filter((r) => isUUID(r.id));
  const insertRules = rules.filter((r) => !isUUID(r.id));

  // Load existing rule IDs
  const { data: existing, error: existingError } = await supabase
    .from("fraud_rules")
    .select("id");

  if (existingError) {
    console.error(existingError);
    return NextResponse.json(
      { error: "Failed to load existing fraud rules" },
      { status: 500 }
    );
  }

  const existingIds = new Set(existing.map((r) => r.id));
  const incomingRealIds = new Set(updateRules.map((r) => r.id));

  // DELETE removed rules
  const idsToDelete = [...existingIds].filter(
    (id) => !incomingRealIds.has(id)
  );

  if (idsToDelete.length > 0) {
    const { error } = await supabase
      .from("fraud_rules")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to delete fraud rules" },
        { status: 500 }
      );
    }
  }

  // UPDATE existing rules
  for (const r of updateRules) {
    const { error } = await supabase
      .from("fraud_rules")
      .update({
        label: r.label,
        description: r.description,
        applies_to_signal_type: r.applies_to_signal_type,
        threshold_count: r.threshold_count,
        threshold_window_minutes: r.threshold_window_minutes,
        severity: r.severity,
        enabled: r.enabled,
      })
      .eq("id", r.id);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to update fraud rule" },
        { status: 500 }
      );
    }
  }

  // INSERT new rules
  if (insertRules.length > 0) {
    const insertPayload = insertRules.map((r) => ({
      label: r.label,
      description: r.description,
      applies_to_signal_type: r.applies_to_signal_type,
      threshold_count: r.threshold_count,
      threshold_window_minutes: r.threshold_window_minutes,
      severity: r.severity,
      enabled: r.enabled,
    }));

    const { error } = await supabase
      .from("fraud_rules")
      .insert(insertPayload);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to insert fraud rules" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
