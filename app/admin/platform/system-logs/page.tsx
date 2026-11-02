import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { SystemLogsClient } from "./SystemLogsClient";
import { getAdminContext } from "@/lib/admin/context";

export default async function SystemLogsPage() {
  const admin = await getAdminContext();
  if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN") {
    redirect("/admin");
  }

  return (
    <AdminShell email={admin.email} role={admin.role} title="System Logs">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">System Logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review platform, security, and administrative events.
          </p>
        </div>
        <SystemLogsClient />
      </div>
    </AdminShell>
  );
}
