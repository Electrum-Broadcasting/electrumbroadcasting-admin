import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminRole, AdminAccessError } from "@/lib/admin/guards";
import { auditedInsert } from "@/lib/admin/mutations";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: cities, error } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load cities:", error);
    return NextResponse.json({ cities: [] });
  }

  return NextResponse.json({ cities });
}

export async function POST(req: Request) {
  try {
    const context = await requireAdminRole("PLATFORM_ADMIN");
    const body = await req.json();

    const { name, slug, domain, status } = body;

    await auditedInsert(
      { context, table: "cities", action: "create_city", domain: "city" },
      { name, slug, domain, status }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to create city:", error);
    return NextResponse.json({ error: "Failed to create city" }, { status: 500 });
  }
}
