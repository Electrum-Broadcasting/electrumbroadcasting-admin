import { getAdminContext } from "@/lib/admin/context";
import { redirect } from "next/navigation";
import { createAdminAccountAction } from "./actions";

export default async function NewAdminUserPage() {
  const admin = await getAdminContext();

  // Only CEO or PLATFORM_ADMIN can create new admins
  if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Admin User</h1>

      <form action={createAdminAccountAction} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            name="role"
            required
            className="border rounded px-3 py-2 w-full"
          >
            <option value="CEO">CEO</option>
            <option value="PLATFORM_ADMIN">Platform Admin</option>
            <option value="CITY_ADMIN">City Admin</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Admin
        </button>
      </form>
    </div>
  );
}
