"use server";

import { cookies } from "next/headers";

export async function getAdminSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("admin_session");

  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}
