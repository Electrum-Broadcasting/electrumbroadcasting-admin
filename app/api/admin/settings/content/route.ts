import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function authorized() {
  const admin = await getAdminContext();
  return admin.role === "CEO" || admin.role === "PLATFORM_ADMIN";
}

export async function GET() {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("global_content_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Failed to load content settings:", error);
    return NextResponse.json({ error: "Failed to load content settings" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseServerClient();
  const body: unknown = await req.json();
  if (
    !isRecord(body) ||
    typeof body.id !== "string" ||
    typeof body.about_html !== "string" ||
    typeof body.privacy_html !== "string" ||
    typeof body.terms_html !== "string" ||
    typeof body.accessibility_html !== "string" ||
    typeof body.contact_html !== "string" ||
    !Array.isArray(body.faq_json) ||
    !isRecord(body.homepage_sections_json)
  ) {
    return NextResponse.json({ error: "Invalid content settings payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("global_content_settings")
    .update({
      about_html: body.about_html,
      privacy_html: body.privacy_html,
      terms_html: body.terms_html,
      accessibility_html: body.accessibility_html,
      contact_html: body.contact_html,
      faq_json: body.faq_json ?? [],
      homepage_sections_json: body.homepage_sections_json ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update content settings:", error);
    return NextResponse.json({ error: "Failed to update content settings" }, { status: 500 });
  }

  return NextResponse.json(data);
}
