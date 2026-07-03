"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CeoUsersHeader() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-ink">Users</h2>

      <Button onClick={() => router.push("/admin/CEO/users/new")}>
        New User
      </Button>
    </div>
  );
}
