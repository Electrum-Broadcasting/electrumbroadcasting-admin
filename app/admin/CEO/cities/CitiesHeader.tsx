"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CitiesHeader() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-ink">Cities</h2>

      <Button onClick={() => router.push("/admin/CEO/cities/new")}>
        New City
      </Button>
    </div>
  );
}
