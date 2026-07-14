"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { verifyPassword } from "@/lib/admin/password";

export async function loginAdminAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. SSR client (anon key) with correct cookie adapter
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

  // 2. Lookup admin user
  const result = await supabaseSSR
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  const admin = result.data;
  if (!admin) redirect("/login?error=Invalid credentials");

  // 3. Verify custom password hash
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) redirect("/login?error=Invalid credentials");

  // 4. Service-role sign-in
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sessionData, error: sessionError } =
    await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

  if (sessionError) redirect("/login?error=Invalid credentials");

  // 5. Write session cookie
  await supabaseSSR.auth.setSession(sessionData.session);

  // 6. Attach role metadata
  await supabaseSSR.auth.updateUser({
    data: { role: admin.role },
  });

  // 7. Redirect to admin dashboard
  redirect("/admin");
}
