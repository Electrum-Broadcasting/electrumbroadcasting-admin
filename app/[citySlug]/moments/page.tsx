"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MomentAdminListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;
  const [moments, setMoments] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("moments")
        .select("*")
        .eq("city_slug", citySlug);

      setMoments(data || []);
    }

    load();
  }, [citySlug]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Moments</h1>

      <Link
        href={`/${citySlug}/moments/create`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Moment
      </Link>

      <div className="space-y-4">
        {moments.map((moment) => (
          <Link
            key={moment.id}
            href={`/${citySlug}/moments/${moment.slug}/edit`}
            className="block border rounded p-4 hover:bg-gray-50"
          >
            <div className="text-xl font-semibold">{moment.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
