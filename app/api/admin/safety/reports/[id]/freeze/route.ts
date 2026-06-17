import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { email } = await getAdminContext();
  const supabase = createSupabaseServiceClient();

  // Fetch the report to get the city
  const { data: report } = await supabase
    .from("safety_reports")
    .select("city_id")
    .eq("id", params.id)
    .single();

  if (report?.city_id) {
    await supabase
      .from("cities")
      .update({ frozen: true })
      .eq("id", report.city_id);
  }

  await supabase.from("audit_logs").insert({
    actor: email,
    action: "freeze_city",
    entity: report?.city_id ?? "unknown",
  });

  return NextResponse.redirect(`/admin/CEO/safety/reports/${params.id}`);
}
