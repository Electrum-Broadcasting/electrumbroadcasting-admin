"use server";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import { hashPassword } from "@/lib/admin/password";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/admin/guards";
import { logAdminAction } from "@/lib/admin/logAdminAction";

export async function createAdminAccountAction(formData: FormData) {
  const admin = await requireAdminRole("PLATFORM_ADMIN");

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
  await logAdminAction(supabase, {
    actorUserId: admin.user_id,
    actorRole: admin.role,
    action: "create_admin_user",
    domain: "global",
    entityType: "admin_users",
    entityId: adminRow?.id ?? null,
    metadata: { created_email: email, new_role: role },
  });

  redirect("/admin/CEO/admin-users");
}
