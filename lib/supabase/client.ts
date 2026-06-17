import { createBrowserClient as _supabaseCreateBrowserClient } from "@supabase/ssr";

export function createBrowserClient() {
  return _supabaseCreateBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}

export const createSupabaseBrowserClient = createBrowserClient;
