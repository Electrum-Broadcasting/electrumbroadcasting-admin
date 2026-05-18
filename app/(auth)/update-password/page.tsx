import { AuthCard } from "@/components/admin/AuthCard";
import { updatePasswordAction } from "@/app/(auth)/actions";

interface UpdatePasswordPageProps {
	searchParams?: {
		error?: string;
	};
}

export default function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
	return (
		<AuthCard
			title="Set New Password"
			description="Choose a new password for your account."
			footerLinkHref="/login"
			footerLinkLabel="Back to Login"
		>
			<form action={updatePasswordAction} className="space-y-4">
				<div>
					<label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
						New Password
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
					Update Password
				</button>
			</form>
		</AuthCard>
	);
}
