"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminTables } from "@/lib/admin/config";

const staticLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reset-password", label: "Reset Password" }
];

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    ...staticLinks,
    ...Object.values(adminTables).map((table) => ({
      href: table.route,
      label: table.label
    }))
  ];

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              active ? "bg-ink text-paper" : "text-slate hover:bg-slate-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
