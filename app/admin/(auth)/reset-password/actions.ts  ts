"use server";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { hashPassword } from "@/lib/admin/password";

export async function resetAdminPasswordAction(formData: FormData) {
  const rawToken = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("password") ?? "");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Find matching reset request
  const { data: reset } = await supabase
    .from("admin_password_resets")
    .select("*")
    .eq("used", false)
    .lte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reset) {
    redirect("/admin/(auth)/reset-password?error=Invalid or expired token");
  }

  // Verify token
  const valid = await bcrypt.compare(rawToken, reset.token_hash);
  if (!valid) {
    redirect("/admin/(auth)/reset-password?error=Invalid or expired token");
  }

  // Hash new password
  const password_hash = await hashPassword(newPassword);

  // Update admin password
  await supabase
    .from("admin_users")
    .update({ password_hash })
    .eq("user_id", reset.admin_user_id);

  // Mark token as used
  await supabase
    .from("admin_password_resets")
    .update({ used: true })
    .eq("id", reset.id);

  redirect("/admin/(auth)/login?reset=1");
}
