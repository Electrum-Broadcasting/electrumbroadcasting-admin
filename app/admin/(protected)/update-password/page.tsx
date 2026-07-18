"use server";

import { getAdminContext } from "@/lib/admin/context";
import UpdatePasswordPageClient from "./UpdatePasswordPageClient";

export default async function UpdatePasswordPage() {
  const admin = await getAdminContext();
  return <UpdatePasswordPageClient admin={admin} />;
}
