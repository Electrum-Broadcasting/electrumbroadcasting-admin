import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

export async function middleware(req: { cookies: { get: (arg0: any) => { (): any; new(): any; value: any; }; }; }) {
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

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
