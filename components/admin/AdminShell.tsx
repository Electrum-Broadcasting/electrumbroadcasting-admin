import type { AdminRole } from "@/lib/admin/types";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/app/admin/(auth)/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  email: string | null;
  role: AdminRole;
  title: string;
  cityName?: string;
  cityId?: string;
  citySlug?: string;
  children: React.ReactNode;
}

const ROLE_DISPLAY: Record<AdminRole, string> = {
  CEO: "Chief Executive Officer",
  PLATFORM_ADMIN: "Platform Administrator",
  CITY_ADMIN: "City Administrator",
  EDITOR: "Editor",
};

export function AdminShell({ email, role, title, cityName, cityId, citySlug, children }: AdminShellProps) {
  const displayRole = ROLE_DISPLAY[role] ?? role;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Electrum Broadcasting
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <div>
              <p className="font-medium">{email ?? "Unknown"}</p>
              <p className="text-muted-foreground">
                {displayRole} <span aria-hidden="true">·</span>{" "}
                {role === "CEO" ? "All Cities" : cityName ?? "No city assigned"}
              </p>
            </div>
            <Link
              href="/admin/update-password"
              className="text-sm text-primary underline-offset-4 transition-colors hover:underline"
            >
              Change password
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-2xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-6 lg:py-6">
        <aside className="shrink-0 rounded-lg border border-border bg-card p-2 shadow-sm lg:sticky lg:top-6 lg:h-fit lg:w-56">
          <AdminNav role={role} cityId={cityId} />
        </aside>
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
