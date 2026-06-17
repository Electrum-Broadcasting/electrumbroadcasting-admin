import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServiceClient();
  const cityId = params.id;
  const body = await req.json();

  const { name, slug, domain, status } = body;

  const { error } = await supabase
    .from("cities")
    .update({ name, slug, domain, status })
    .eq("id", cityId);

  if (error) {
    console.error("Failed to update city:", error);
    return NextResponse.json({ error: "Failed to update city" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServiceClient();
  const cityId = params.id;

  const { error } = await supabase.from("cities").delete().eq("id", cityId);

  if (error) {
    console.error("Failed to delete city:", error);
    return NextResponse.json({ error: "Failed to delete city" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
