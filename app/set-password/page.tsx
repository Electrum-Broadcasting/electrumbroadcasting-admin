import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setPasswordAction } from "./actions";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIREMENTS =
  "Password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number and a symbol.";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    return (
      <AuthCard
        title="Set Password"
        description="Your invitation session was not found or has expired."
      >
        <Link href="/login" className="text-sm font-medium hover:underline">
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set Your Password"
      description={`Choose a password for ${data.user.email ?? "your account"}.`}
    >
      <form action={setPasswordAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <p className="text-xs text-slate-500">
          {PASSWORD_REQUIREMENTS} Both entries must match.
        </p>

        {searchParams?.error ? (
          <p className="text-sm text-danger">{searchParams.error}</p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper"
        >
          Set Password
        </button>
      </form>
    </AuthCard>
  );
}
