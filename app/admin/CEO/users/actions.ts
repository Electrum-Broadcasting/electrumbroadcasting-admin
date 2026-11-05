"use server";

import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin/guards";
import { deleteAdminUserForManagement } from "@/lib/admin/user-management";

export async function deleteAdminUserAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const id = String(formData.get("id") ?? "");
  const result = await deleteAdminUserForManagement(id, admin);

  if (!result.ok) {
    redirect(
      `/admin/CEO/users/${encodeURIComponent(id)}/delete?error=${encodeURIComponent(result.error)}`
    );
  }

  redirect("/admin/CEO/users?toast=User%20deleted%20successfully");
}
