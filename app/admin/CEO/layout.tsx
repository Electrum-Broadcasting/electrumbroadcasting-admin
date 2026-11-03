import type { ReactNode } from "react";
import { requirePlatformAdmin } from "@/lib/admin/guards";

export default async function CeoAreaLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePlatformAdmin();
  return <>{children}</>;
}
