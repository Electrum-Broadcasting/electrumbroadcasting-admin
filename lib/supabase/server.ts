import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const headerStore = headers();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // ❗ Next.js forbids cookie writes during RSC render
        // ❗ Supabase SSR will attempt to refresh tokens automatically
        // ❗ We disable writes to prevent crashes
        set() {},
        remove() {},
      },
      headers: {
        get(name: string) {
          return headerStore.get(name) ?? undefined;
        },
      },
    }
  );
}

export function createSupabasePublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
export function createSupabaseRouteClient() {
  const cookieStore = cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}
