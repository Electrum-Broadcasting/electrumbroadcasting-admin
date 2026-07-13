"use client";

import { useState } from "react";
import { PasswordField } from "@/components/admin/auth/PasswordField";
import { updateAdminPasswordAction } from "./actions";

export default function UpdatePasswordPageClient({ admin }: { admin: any }) {
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Update Password</h1>

      <p className="text-sm text-slate-600 mb-6">
        You are updating the password for <strong>{admin.email}</strong>.
      </p>

      <form action={updateAdminPasswordAction} className="space-y-6">
        <PasswordField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
