import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole } from "@/lib/admin/types";

const ADMIN_COOKIE_NAME = "admin_session";

export interface AdminSession {
  admin_id: string;
  role: string;
}

export function setAdminSessionCookie(session: AdminSession) {
  cookies().set(
    ADMIN_COOKIE_NAME,
    JSON.stringify(session),
    {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
    }
  );
}

export function clearAdminSessionCookie() {
  cookies().set(
    ADMIN_COOKIE_NAME,
    "",
    {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    }
  );
}

export function getAdminSession(): AdminSession | null {
  const cookie = cookies().get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

export async function requireAdminContext() {
  const session = getAdminSession();
  if (!session?.admin_id || !session?.role) {
    redirect("/login");
  }

  return {
    id: session.admin_id,
    role: session.role as AdminRole,
    email: null,
  };
}
