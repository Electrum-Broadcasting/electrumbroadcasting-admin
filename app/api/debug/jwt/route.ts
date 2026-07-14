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

  const { data: { session } } = await supabase.auth.getSession();

  return NextResponse.json({
    access_token: session?.access_token ?? null,
    user: session?.user ?? null,
    jwt_role: session?.user?.user_metadata?.role ?? null,
  });
}
