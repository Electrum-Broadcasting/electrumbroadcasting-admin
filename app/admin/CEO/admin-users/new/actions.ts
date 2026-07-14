"use server";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import { hashPassword } from "@/lib/admin/password";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";

export async function createAdminAccountAction(formData: FormData) {
  const admin = await getAdminContext();

  // Only CEO or PLATFORM_ADMIN can create new admins
  if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN") {
    redirect("/admin");
  }

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const password_hash = await hashPassword(password);

  // 1. Insert into admin_users (your real login system)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .insert({
      email,
      role,
      password_hash,
      status: "active",
      city_ids: [],
    })
    .select()
    .single();

  if (error) {
    redirect(`/admin/CEO/admin-users/new?error=${encodeURIComponent(error.message)}`);
  }

  // 2. Create Supabase Auth user (for JWT + RLS only)
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password, // the real plaintext password
      user_metadata: { role },
    });

  if (authError) {
    redirect(`/admin/CEO/admin-users/new?error=${encodeURIComponent(authError.message)}`);
  }

  // 3. Log creation
  await supabase.rpc("log_admin_action", {
    action: "ADMIN_CREATE_USER",
    user_id: admin.id,
    target_user_id: adminRow?.id ?? null,
    old_role: null,
    new_role: role,
    metadata: { created_email: email },
  });

  redirect("/admin/CEO/admin-users");
}
