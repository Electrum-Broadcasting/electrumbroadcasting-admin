import { cookies } from "next/headers";

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
      httpOnly: false,      // TEMP: make visible in devtools
      secure: false,        // TEMP: avoid HTTPS requirement
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
