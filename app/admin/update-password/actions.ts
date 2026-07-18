"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hashPassword } from "@/lib/admin/password";
import { getAdminSession } from "@/lib/admin/session";

export async function updateAdminPasswordAction(formData: FormData) {
  const newPassword = String(formData.get("password") ?? "");

  const adminSession = await getAdminSession();
  if (!adminSession) redirect("/login?error=Not authenticated");

  const password_hash = await hashPassword(newPassword);

  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );

  const ceoUserId = process.env.CEO_USER_ID;
  if (!ceoUserId) {
    redirect("/admin/update-password?error=Missing CEO user configuration");
  }

  const { data: admin, error: loadError } = await supabaseAdmin
    .from("admin_users")
    .select("auth_uid")
    .eq("auth_uid", ceoUserId)
    .maybeSingle();

  if (loadError || !admin) {
    console.error("Load admin error:", loadError);
    redirect("/login?error=Admin not found");
  }

  const { error: authUpdateError } =
    await supabaseAdmin.auth.admin.updateUserById(ceoUserId, {
      password: newPassword,
    });

  if (authUpdateError) {
    console.error("Auth password update error:", authUpdateError);
    redirect("/admin/update-password?error=Auth password update failed");
  }

  const { error: hashUpdateError } = await supabaseAdmin
    .from("admin_users")
    .update({ password_hash })
    .eq("auth_uid", ceoUserId);

  if (hashUpdateError) {
    console.error("Hash update error:", hashUpdateError);
    redirect("/admin/update-password?error=Hash update failed");
  }

  const cookieStore = cookies();

  cookieStore.set("admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  redirect("/login?success=Password updated, please log in again");
}
