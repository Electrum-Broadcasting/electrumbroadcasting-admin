import { AuthCard } from "@/components/admin/AuthCard";
import { resetPasswordAction } from "@/app/(auth)/actions";

interface ResetPasswordPageProps {
	searchParams?: {
		error?: string;
		success?: string;
	};
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
	return (
		<AuthCard
			title="Reset Password"
			description="Request a password reset email for your account."
			footerLinkHref="/login"
			footerLinkLabel="Back to Login"
		>
			<form action={resetPasswordAction} className="space-y-4">
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
				{searchParams?.error ? <p className="text-sm text-danger">{searchParams.error}</p> : null}
				{searchParams?.success ? <p className="text-sm text-green-700">{searchParams.success}</p> : null}
				<button type="submit" className="w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper">
					Send Reset Link
				</button>
			</form>
		</AuthCard>
	);
}
