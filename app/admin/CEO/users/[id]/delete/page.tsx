import { AdminShell } from "@/components/admin/AdminShell";
import { requirePlatformAdmin } from "@/lib/admin/guards";
import Link from "next/link";
import { ToastBoundary } from "@/components/ui/ToastBoundary";
import { getAdminUserForManagement } from "@/lib/admin/user-management";
import { deleteAdminUserAction } from "../../actions";

export default async function DeleteUserPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const admin = await requirePlatformAdmin();
  const user = await getAdminUserForManagement(params.id);

  if (!user) {
    return (
      <AdminShell email={admin.email} role={admin.role} title="User Not Found">
        <p className="text-red-600">User not found.</p>
        <Link href="/admin/CEO/users" className="text-ink underline">
          Back to Users
        </Link>
      </AdminShell>
    );
  }

  return (
    <ToastBoundary
      toast={searchParams.error ? decodeURIComponent(searchParams.error) : undefined}
    >
      <AdminShell email={admin.email} role={admin.role} title="Delete User">
        <h1 className="text-xl font-semibold text-ink mb-4">
          Delete User: {user.email}
        </h1>

        <p className="text-slate-700 mb-6">
          Are you sure you want to delete this user? This action cannot be
          undone.
        </p>

        <div className="flex gap-4">
          <form action={deleteAdminUserAction}>
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm border border-red-700 hover:bg-red-700"
            >
              Yes, Delete User
            </button>
          </form>

          <Link
            href={`/admin/CEO/users/${user.id}`}
            className="text-ink hover:underline text-sm"
          >
            Cancel
          </Link>
        </div>
      </AdminShell>
    </ToastBoundary>
  );
}
