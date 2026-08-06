"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

function formatMomentTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MomentsListPage({ params }: { params: { citySlug: string } }) {
  const { citySlug } = params;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [moments, setMoments] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      const { data: momentList } = await supabase
        .from("civic_moments")
        .select("*")
        .eq("city_id", city.id)
        .order("moment_time", { ascending: true });

      setMoments(momentList || []);
      setLoading(false);
    }

    load();
  }, [citySlug]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Moments</h1>

      <Link
        href={`/${citySlug}/moments/create`}
        className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Create New Moment
      </Link>

      <div className="space-y-4 mt-6">
        {moments.length === 0 && (
          <div className="text-gray-600">No moments yet.</div>
        )}

        {moments.map((m) => (
          <div
            key={m.id}
            className="border p-4 rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="text-lg font-semibold">{m.title || "(Untitled)"}</div>
              <div className="text-gray-600">{formatMomentTime(m.moment_time)}</div>
              <div className="text-gray-500 text-sm">Slug: {m.slug}</div>
              {!m.is_published && (
                <div className="text-red-600 text-sm font-medium">Unpublished</div>
              )}
            </div>

<Link
  href={`/${m.city_slug}/moments/${m.slug}`}
  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
>
  View
</Link>

<Link
  href={`/${m.city_slug}/moments/${m.slug}/edit`}
  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ml-2"
>
  Edit
</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
