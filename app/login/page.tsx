"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/admin/AuthCard";
import { PasswordField } from "@/components/admin/auth/PasswordField";
import { loginAdminAction } from "@/app/admin/(auth)/actions";

export default function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthCard
      title="Admin Login"
      description="Sign in with your Supabase account to access administration modules."
      footerLinkHref="/create-account"
      footerLinkLabel="Create Account"
    >
      <form action={loginAdminAction} className="space-y-4">
        <input type="hidden" name="next" value={searchParams?.next ?? "/admin"} />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
        />

        {/* Pass the controlled password value to the server action */}
        <input type="hidden" name="password" value={password} />

        {searchParams?.error ? (
          <p className="text-sm text-danger">{searchParams.error}</p>
        ) : null}

        {searchParams?.success ? (
          <p className="text-sm text-green-700">{searchParams.success}</p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper"
        >
          Sign In
        </button>
      </form>

      <div className="mt-4 text-sm text-slate-600">
        <Link href="/reset-password" className="font-medium hover:underline">
          Forgot password?
        </Link>
      </div>
    </AuthCard>
  );
}
