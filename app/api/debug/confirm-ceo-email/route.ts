import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const authUserId = "2b048664-ce4a-4515-a653-dd6f304017c9";

  const { data, error } = await supabase.auth.admin.updateUserById(authUserId, {
    email_confirm: true
  });

  return NextResponse.json({ data, error });
}
