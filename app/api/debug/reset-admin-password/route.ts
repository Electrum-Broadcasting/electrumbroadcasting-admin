import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/admin/password";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const password_hash = await hashPassword("L4KEshore99$");

  const { data, error } = await supabase
    .from("public.admin_users")
    .update({ password_hash })
    .eq("id", "2b048664-ce4a-4515-a653-dd6f304017c9");

  return NextResponse.json({ data, error });
}
