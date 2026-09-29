import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("global_content_settings")
    .select("*")
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = createSupabaseServerClient();
  const body = await req.json();

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

  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(data);
}
