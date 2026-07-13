import { getAdminSession } from "./auth";
import { redirect } from "next/navigation";

export function requireAdmin() {
  const session = getAdminSession();
  if (!session) redirect("/admin/(auth)/login");
  return session;
}
