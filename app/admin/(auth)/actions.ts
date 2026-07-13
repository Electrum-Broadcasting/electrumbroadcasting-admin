"use server";

import { redirect } from "next/navigation";
import { setAdminSessionCookie } from "@/lib/admin/auth";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import { headers } from "next/headers";
import { verifyPassword } from "@/lib/admin/password";
import { clearAdminSessionCookie, getAdminSession } from "@/lib/admin/auth";

export async function loginAdminAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Look up admin user
  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!admin) {
  redirect("/login?error=Invalid credentials");
}

  // 2. Verify password
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    redirect("/login?error=Invalid credentials");
  }
  
  // DEBUG: prove we got here
  console.log("LOGIN OK, setting admin_session for", admin.user_id);
  
  setAdminSessionCookie({
    admin_id: admin.user_id,
    role: admin.role,
  });

  // 3. Set admin session cookie
  setAdminSessionCookie({
    admin_id: admin.user_id,
    role: admin.role,
  });

  // 4. Log ADMIN_LOGIN
  const h = headers();
  await supabase.rpc("log_admin_action", {
    action: "ADMIN_LOGIN",
    user_id: admin.user_id,
    target_user_id: admin.user_id,
    old_role: null,
    new_role: admin.role,
    metadata: {
      ip: h.get("x-forwarded-for") ?? "unknown",
      user_agent: h.get("user-agent") ?? "unknown",
    },
  });

  // 5. Redirect to admin dashboard
  redirect("/admin");
}

export async function logoutAction() {
  const session = getAdminSession();

  // If no session, just redirect
  if (!session) {
    clearAdminSessionCookie();
    redirect("/login");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Log ADMIN_LOGOUT
  await supabase.rpc("log_admin_action", {
    action: "ADMIN_LOGOUT",
    user_id: session.admin_id,
    target_user_id: session.admin_id,
    old_role: null,
    new_role: session.role,
    metadata: null,
  });

  // Clear cookie
  clearAdminSessionCookie();

  // Redirect to admin login
  redirect("/login");
}