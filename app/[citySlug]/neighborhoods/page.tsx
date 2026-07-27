"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NeighborhoodAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("neighborhoods")
        .select("*")
        .eq("city_slug", citySlug);

      setNeighborhoods(data || []);
    }

    load();
  }, [citySlug]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Neighborhoods</h1>

      <Link
        href={`/${citySlug}/neighborhoods/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Neighborhood
      </Link>

      <div className="space-y-4">
        {neighborhoods.map((n) => (
          <Link
            key={n.id}
            href={`/${citySlug}/neighborhoods/${n.slug}/edit`}
            className="block border rounded p-4 hover:bg-gray-50"
          >
            <div className="text-xl font-semibold">{n.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
