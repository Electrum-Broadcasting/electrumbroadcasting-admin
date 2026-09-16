import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const requestHeaders = headers();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Story actions use the request cookie without persisting refreshes.
        },
        remove() {
          // Story actions use the request cookie without persisting removals.
        },
      },
      global: {
        headers: Object.fromEntries(requestHeaders.entries()),
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
