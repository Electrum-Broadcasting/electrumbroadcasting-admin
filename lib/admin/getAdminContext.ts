// lib/admin/getAdminContext.ts

import { getAdminContext as loadAdminContext } from "./auth";

export async function getAdminContext() {
  return await loadAdminContext();
}
