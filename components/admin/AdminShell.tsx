import type { AdminRole } from "@/lib/admin/types";
import { AdminNav } from "@/components/admin/AdminNav";

interface AdminShellProps {
  email: string;
  role: AdminRole;
  children: React.ReactNode;
}

export function AdminShell({ email, role, children }: AdminShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Electrum Broadcasting</p>
            <h1 className="text-lg font-semibold text-ink">Admin System</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-ink">{email}</p>
            <p className="text-slate-500">Role: {role}</p>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <AdminNav />
        </aside>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{children}</section>
      </div>
    </div>
  );
}
