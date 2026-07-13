import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FraudSignalUpdate = {
  reviewed: boolean;
};

type AuditLogInsert = {
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: any | null;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user_id } = await getAdminContext(); // IMPORTANT: use user_id, not email
  const supabase = createSupabaseServerClient();

  // --- Update fraud signal ---
  await supabase
    .from("fraud_signals")
    .update({ reviewed: true } satisfies FraudSignalUpdate)
    .eq("id", params.id);

  // --- Insert audit log ---
  await supabase
    .from("audit_logs")
    .insert([
      {
        actor_user_id: user_id,
        action: "review_fraud_signal",
        entity_type: "fraud_signal",
        entity_id: params.id,
      } satisfies AuditLogInsert
    ]);

  return NextResponse.redirect(`/admin/CEO/safety/fraud/${params.id}`);
}
