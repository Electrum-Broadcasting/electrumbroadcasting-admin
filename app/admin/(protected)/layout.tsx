import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentRole, requireAuthenticatedUser } from "@/lib/admin/auth";

export default async function AdminProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();
  const role = await getCurrentRole(user.id);

  if (!role) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-lg rounded-lg border border-red-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-ink">Access denied</h1>
          <p className="mt-3 text-sm text-slate-600">
            Your account is authenticated but does not have an admin role assignment.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Ask an existing admin to add your user_id to the admin_users table.
          </p>
        </div>
      </main>
    );
  }

  return <AdminShell email={user.email ?? "Unknown user"} role={role}>{children}</AdminShell>;
}
