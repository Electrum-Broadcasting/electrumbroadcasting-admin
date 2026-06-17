import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { email } = await getAdminContext();
  const supabase = createSupabaseServiceClient();

  await supabase
    .from("fraud_signals")
    .update({ reviewed: true })
    .eq("id", params.id);

  await supabase.from("audit_logs").insert({
    actor: email,
    action: "review_fraud_signal",
    entity: params.id,
  });

  return NextResponse.redirect(`/admin/CEO/safety/fraud/${params.id}`);
}
