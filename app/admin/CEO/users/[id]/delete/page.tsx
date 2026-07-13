import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ToastBoundary } from "@/components/ui/ToastBoundary";
import { ToastTrigger } from "@/components/ui/ToastTrigger";

type AdminUserRow = {
  user_id: string;
  email: string;
  role: string;
  city_ids: string[] | null;
  status: string;
};

async function getUserById(id: string): Promise<AdminUserRow | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id, email, role, city_ids, status")
    .eq("user_id", id)
    .single();

  return (data as AdminUserRow) ?? null;
}

async function deleteUser(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.from("admin_users").delete().eq("user_id", id);
}

export default async function DeleteUserPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { toast?: string; confirm?: string };
}) {
  const admin = await getAdminContext();
  const user = await getUserById(params.id);

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

  // If the user confirmed deletion via ?confirm=true
  if (searchParams.confirm === "true") {
    await deleteUser(params.id);

    return (
      <AdminShell email={admin.email} role={admin.role} title="User Deleted">
        <ToastTrigger message="User deleted successfully." />
        <p className="text-green-700 font-medium mb-4">
          User {user.email} has been deleted.
        </p>
        <Link href="/admin/CEO/users" className="text-ink underline">
          Back to Users
        </Link>
      </AdminShell>
    );
  }

  return (
    <ToastBoundary>
      <AdminShell email={admin.email} role={admin.role} title="Delete User">
        <h1 className="text-xl font-semibold text-ink mb-4">
          Delete User: {user.email}
        </h1>

        <p className="text-slate-700 mb-6">
          Are you sure you want to delete this user? This action cannot be
          undone.
        </p>

        <div className="flex gap-4">
          <Link
            href={`/admin/CEO/users/${user.user_id}/delete?confirm=true`}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm border border-red-700 hover:bg-red-700"
          >
            Yes, Delete User
          </Link>

          <Link
            href={`/admin/CEO/users/${user.user_id}`}
            className="text-ink hover:underline text-sm"
          >
            Cancel
          </Link>
        </div>
      </AdminShell>
    </ToastBoundary>
  );
}
