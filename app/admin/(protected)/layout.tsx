import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email, role } = await getAdminContext();

  return (
    <ToastProvider>
      <AdminShell email={email ?? "Unknown user"} role={role} title="Admin">
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
