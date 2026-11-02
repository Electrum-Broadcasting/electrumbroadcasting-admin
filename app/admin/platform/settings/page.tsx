import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/context";
import PlatformSettingsClient from "./PlatformSettingsClient";

export default async function PlatformSettingsPage() {
  const admin = await getAdminContext();
  if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN") {
    redirect("/admin");
  }

  return (
    <AdminShell email={admin.email} role={admin.role} title="Platform Settings">
      <PlatformSettingsClient />
    </AdminShell>
  );
}
