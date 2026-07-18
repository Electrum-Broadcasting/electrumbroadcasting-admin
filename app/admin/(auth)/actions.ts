"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { verifyPassword } from "@/lib/admin/password";

export async function loginAdminAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = cookies();

  // ONE client only — SSR client with cookie adapter
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

  // 1. Load admin user from your DB
  const { data: admin } = await supabaseSSR
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!admin) redirect("/login?error=Invalid credentials");

  // 2. Verify custom password hash
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) redirect("/login?error=Invalid credentials");

  // 3. REAL Supabase Auth login using SSR client
  const { data: sessionData, error: sessionError } =
    await supabaseSSR.auth.signInWithPassword({
      email,
      password,
    });

  if (sessionError) redirect("/login?error=Invalid credentials");

  // ⭐ 4. VERIFY the Supabase Auth session (CRITICAL)
  const { data: authData, error: authError } = await supabaseSSR.auth.getUser();
  if (authError || !authData?.user) {
    redirect("/login?error=Invalid credentials");
  }

  // 5. Attach role metadata
  await supabaseSSR.auth.updateUser({
    data: { role: admin.role },
  });

  // 6. Write your admin_session cookie LAST
  cookieStore.set(
    "admin_session",
    JSON.stringify({
      auth_uid: admin.auth_uid,
      email: admin.email,
      role: admin.role,
    }),
    {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    }
  );

  redirect("/admin");
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

  // Clear admin cookie too
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  redirect("/login");
}
