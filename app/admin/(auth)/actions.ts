"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";

const INVALID_CREDENTIALS = "/login?error=Invalid credentials";

// Only same-origin /admin paths are honoured; anything else falls back to /admin.
function safeAdminNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  const isAdminPath = next === "/admin" || next.startsWith("/admin/");
  if (!isAdminPath || next.startsWith("//") || next.includes("\\")) {
    return "/admin";
  }
  return next;
}

export async function loginAdminAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeAdminNext(formData.get("next"));

  const cookieStore = cookies();

  const supabaseSSR = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  // 1. Supabase Auth is the only password authority
  const { data: signInData, error: signInError } =
    await supabaseSSR.auth.signInWithPassword({ email, password });

  const authUser = signInData?.user;
  if (signInError || !authUser) {
    await supabaseSSR.auth.signOut();
    redirect(INVALID_CREDENTIALS);
  }

  // 2. The authenticated user must map to an active admin_users row
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: admin, error: adminError } = await service
    .from("admin_users")
    .select("status")
    .eq("auth_uid", authUser.id)
    .maybeSingle();

  if (adminError || !admin || admin.status !== "active") {
    await supabaseSSR.auth.signOut();
    redirect(INVALID_CREDENTIALS);
  }

  redirect(next);
}

export async function logoutAction() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  await supabase.auth.signOut();

  redirect("/login");
}
