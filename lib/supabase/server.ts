import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,        // ⬅️ changed
    process.env.SUPABASE_ANON_KEY!,   // ⬅️ changed
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // NO-OP: pages must not write cookies
        },
        remove() {
          // NO-OP
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
