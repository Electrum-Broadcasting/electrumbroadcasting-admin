// lib/supabase/server.ts

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from "./env";

export function createSupabaseServerClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Cookie-aware client that forwards the caller's Supabase Auth session, so
// RPCs relying on auth.uid() (e.g. admin identity checks) resolve correctly.
// Use this instead of createSupabaseServerClient() for admin write actions
// that call SECURITY DEFINER RPCs gated on auth.uid().
export function createSupabaseServerActionClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: any) {
        cookieStore.set(name, "", options);
      },
    },
  });
}
