import type { AdminRole } from "@/lib/admin/types";
import { AdminNav } from "@/components/admin/AdminNav";

interface AdminShellProps {
  email: string | null;
  role: AdminRole;
  title: string;
  cityName?: string;
  children: React.ReactNode;
}

export function AdminShell({ email, role, title, cityName, children }: AdminShellProps) {
  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Electrum Broadcasting
            </p>
            <h1 className="text-lg font-semibold text-ink">{title}</h1>
          </div>

          <div className="text-right text-sm">
            <p className="font-medium text-ink">{email ?? "Unknown"}</p>
            <p className="text-slate-500">Role: {role}</p>
            <p className="text-slate-400">
              {role === "CEO" ? "All Cities" : cityName}
            </p>
          </div>
        </div>
      </header>

      {/* FULL-WIDTH LAYOUT */}
      <div className="flex gap-6 py-6 px-6">
        
        {/* SIDEBAR */}
        <aside className="w-[220px] shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <AdminNav role={role} />
        </aside>

        {/* MAIN CONTENT — TRUE FULL WIDTH */}
        <section className="flex-1 min-w-0">
          {children}
        </section>
      </div>
    </div>
  );
}
