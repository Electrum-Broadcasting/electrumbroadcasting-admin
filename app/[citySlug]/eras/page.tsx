"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EraListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [eras, setEras] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("city_slug", citySlug);

      setEras(data || []);
    }

    load();
  }, [citySlug]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Civic Eras</h1>

      <div className="space-y-4">
        {eras.map((era) => (
          <Link
            key={era.id}
            href={`/${citySlug}/eras/${era.slug}`}
            className="block border rounded p-4 hover:bg-gray-50"
          >
            <div className="text-xl font-semibold">{era.name}</div>
            <div className="text-gray-600">
              {era.start_year} – {era.end_year || "Present"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
