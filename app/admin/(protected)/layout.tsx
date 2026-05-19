import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentRole, requireAuthenticatedUser } from "@/lib/admin/auth";

export default async function AdminProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();
  const role = await getCurrentRole(user.id);

  if (role !== "admin") {
    redirect("/");
  }

  return <AdminShell email={user.email ?? "Unknown user"} role={role}>{children}</AdminShell>;
}
