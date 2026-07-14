import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { loginAdminAction } from "@/app/admin/(auth)/actions";

interface LoginPageProps {
  searchParams?: {
    error?: string;
    success?: string;
    next?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
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
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {searchParams?.error ? <p className="text-sm text-danger">{searchParams.error}</p> : null}
        {searchParams?.success ? <p className="text-sm text-green-700">{searchParams.success}</p> : null}
        <button type="submit" className="w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper">
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