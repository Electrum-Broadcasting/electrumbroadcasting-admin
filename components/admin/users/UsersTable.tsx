"use client";

import { useEffect, useState } from "react";
import { UserActions } from "@/components/admin/users/UserActions";

export function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        const data = await res.json();
        setUsers(data.users ?? []);
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading users…</p>;
  }

  if (users.length === 0) {
    return <p className="text-slate-500 text-sm">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Email</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Role</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">City</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Domain</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Created</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-2 text-sm text-ink">{u.email}</td>
              <td className="px-4 py-2 text-sm text-slate-700">{u.role}</td>
              <td className="px-4 py-2 text-sm text-slate-700">{u.city_name ?? "—"}</td>
              <td className="px-4 py-2 text-sm text-slate-700">{u.city_domain ?? "—"}</td>
              <td className="px-4 py-2 text-sm text-slate-700">
                {u.created_at
                  ? new Date(u.created_at).toLocaleDateString()
                  : "—"}
              </td>

              <td className="px-4 py-2 text-sm text-slate-700 flex items-center gap-3">
                <a
                  href={`/admin/CEO/users/${u.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Edit →
                </a>

                <UserActions user={u} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
