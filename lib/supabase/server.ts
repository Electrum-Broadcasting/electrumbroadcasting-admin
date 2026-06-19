// lib/supabase/server.ts

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const headerStore = headers();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
    headers: {
      get(name: string) {
        return headerStore.get(name) ?? undefined;
      },
    },
  });
}
