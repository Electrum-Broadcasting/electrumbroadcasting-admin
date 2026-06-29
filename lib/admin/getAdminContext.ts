// lib/admin/getAdminContext.ts

import { getAdminContext as loadAdminContext } from "./auth";

export async function getAdminContext() {
  const user = await loadAdminContext();
  return {
    email: user.email,
    role: user.role,
    user_id: user.id,
  };
}
