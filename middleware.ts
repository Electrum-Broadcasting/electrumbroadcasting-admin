import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ROLE_COLUMN, ADMIN_ROLE_TABLE, ADMIN_USER_ID_COLUMN, normalizeAdminRole } from "@/lib/admin/role";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const pathname = request.nextUrl.pathname;
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  const { data, error } = await supabase
    .from(ADMIN_ROLE_TABLE)
    .select(ADMIN_ROLE_COLUMN)
    .eq(ADMIN_USER_ID_COLUMN, session.user.id)
    .maybeSingle();

  const role = !error ? normalizeAdminRole(data?.[ADMIN_ROLE_COLUMN]) : null;
  if (role !== "admin") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
