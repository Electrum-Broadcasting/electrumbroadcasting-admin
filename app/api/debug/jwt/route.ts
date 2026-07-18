import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  const { data: authData, error: authError } = await supabase.auth.getUser();

  const user = authData?.user ?? null;
  const accessToken = cookieStore.get("sb-access-token")?.value ?? null;

  return NextResponse.json({
    access_token: accessToken,
    user,
    jwt_role: user?.user_metadata?.role ?? null,
  });
}
