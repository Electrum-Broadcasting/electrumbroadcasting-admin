import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: any) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set(name, value, options);
      },
      remove(name: string, options: any) {
        res.cookies.set(name, "", options);
      },
    },
  });

  // Refresh session if needed
  await supabase.auth.getSession();

  // Next 14 pages cannot directly set a 403 status from a server component.
  if (/^\/admin\/cities\/[^/]+\/safety\/?$/.test(req.nextUrl.pathname)) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.redirect(new URL("/login?error=Not%20authenticated", req.url));
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: admin, error: adminError } = await service.from("admin_users")
      .select("role, status").eq("auth_uid", user.id).maybeSingle();
    if (adminError) {
      console.error("Failed to authorize safety page:", adminError);
      return new NextResponse("Unable to authorize safety page", { status: 500 });
    }
    if (!admin || admin.status !== "active" || admin.role === "EDITOR") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
