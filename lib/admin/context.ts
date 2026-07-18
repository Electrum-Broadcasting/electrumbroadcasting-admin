import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getAdminContext() {
  const cookieStore = cookies();

  // 1. Read admin_session cookie
  const raw = cookieStore.get("admin_session")?.value;
  if (!raw) redirect("/login?error=Not authenticated");

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    redirect("/login?error=Invalid session");
  }

  const { email, auth_uid, role, city_ids, status, primary_city_slug } = session;
  if (!email || !auth_uid || !role) {
    redirect("/login?error=Invalid session");
  }

  return {
    ...session,
    email,
    role,
    auth_uid,
    user_id: session.user_id ?? auth_uid,
    city_ids: Array.isArray(city_ids) ? city_ids : [],
    status: status ?? "active",
    primary_city_slug: primary_city_slug ?? null,
  };
}
