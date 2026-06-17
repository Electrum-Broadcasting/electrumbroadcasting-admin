"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/admin/types";
import { adminTables } from "@/lib/admin/config";

interface AdminNavProps {
  role: AdminRole;
  cityId?: string;
}

const ceoLinks = [
  { href: "/admin/CEO", label: "Dashboard" },
  { href: "/admin/CEO/cities", label: "Cities" },
  { href: "/admin/CEO/users", label: "Users" },
  { href: "/admin/CEO/themes", label: "Themes" },
  { href: "/admin/CEO/safety", label: "Safety" },
  { href: "/admin/platform/system-logs", label: "System Logs" },
  { href: "/admin/platform/settings", label: "Settings" }
];

const cityAdminLinks = (cityId: string) => [
  { href: `/admin/city/${cityId}`, label: "Dashboard" },
  { href: `/admin/city/${cityId}/topics`, label: "Topics" },
  { href: `/admin/city/${cityId}/proposals`, label: "Proposals" },
  { href: `/admin/city/${cityId}/stories`, label: "Stories" },
  { href: `/admin/city/${cityId}/contributors`, label: "Contributors" },
  { href: `/admin/city/${cityId}/editors`, label: "Editors" },
  { href: `/admin/city/${cityId}/media`, label: "Media Library" },
  { href: `/admin/city/${cityId}/theme`, label: "City Theme" },
  { href: `/admin/city/${cityId}/safety`, label: "Safety" }
];

const editorLinks = [
  { href: "/admin/editor", label: "Dashboard" },
  { href: "/admin/editor/review", label: "Review Queue" },
  { href: "/admin/editor/assignments", label: "My Assignments" }
];

const platformAdminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reset-password", label: "Reset Password" },
  ...Object.values(adminTables).map((table) => ({
    href: table.route,
    label: table.label
  }))
];

function getLinks(role: AdminRole, cityId?: string) {
  switch (role) {
    case "CEO":
      return ceoLinks;

    case "CITY_ADMIN":
      return cityId ? cityAdminLinks(cityId) : [];

    case "EDITOR":
      return editorLinks;

    case "PLATFORM_ADMIN":
      return platformAdminLinks;

    default:
      return [{ href: "/admin", label: "Dashboard" }];
  }
}

export function AdminNav({ role, cityId }: AdminNavProps) {
  const pathname = usePathname();
  const links = getLinks(role, cityId);

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-ink text-paper"
                : "text-slate hover:bg-slate-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
