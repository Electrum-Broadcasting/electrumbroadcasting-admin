"use server";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { hashPassword } from "@/lib/admin/password";

export async function updateAdminPasswordAction(formData: FormData) {
  const session = getAdminSession();
  if (!session) {
    redirect("/admin/(auth)/login");
  }

  const newPassword = String(formData.get("password") ?? "");
  const password_hash = await hashPassword(newPassword);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  await supabase
    .from("admin_users")
    .update({ password_hash })
    .eq("user_id", session.admin_id);

  await supabase.rpc("log_admin_action", {
    action: "ADMIN_UPDATE_PASSWORD",
    user_id: session.admin_id,
    target_user_id: session.admin_id,
    old_role: null,
    new_role: null,
    metadata: null,
  });

  redirect("/admin?success=Password updated");
}
