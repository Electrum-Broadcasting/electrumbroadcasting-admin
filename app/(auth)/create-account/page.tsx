import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { createAccountAction } from "@/app/(auth)/actions";

interface CreateAccountPageProps {
	searchParams?: {
		error?: string;
	};
}

export default function CreateAccountPage({ searchParams }: CreateAccountPageProps) {
	return (
		<AuthCard
			title="Create Admin Account"
			description="Create credentials first, then have an existing admin assign your role in admin_users."
			footerLinkHref="/login"
			footerLinkLabel="Back to Login"
		>
			<form action={createAccountAction} className="space-y-4">
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
						minLength={8}
						required
						className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
					/>
				</div>
				{searchParams?.error ? <p className="text-sm text-danger">{searchParams.error}</p> : null}
				<button type="submit" className="w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper">
					Create Account
				</button>
			</form>
		</AuthCard>
	);
}
