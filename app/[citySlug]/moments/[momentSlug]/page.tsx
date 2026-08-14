"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

export default function MomentDetailPage({
  params,
}: {
  params: { citySlug: string; momentSlug: string };
}) {
  const { citySlug, momentSlug } = params;

  const supabase = createBrowserClient();

  const [moment, setMoment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load city
      const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

      if (!city) {
        setLoading(false);
        return;
      }

      // Load moment
      const { data: momentData } = await supabase
        .from("civic_moments")
        .select("*")
        .eq("slug", momentSlug)
        .eq("city_id", city.id)
        .single();

      setMoment(momentData || null);
      setLoading(false);
    }

    load();
  }, [citySlug, momentSlug]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!moment) return <div className="p-6">Moment not found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">{moment.title}</h1>

      <Link
        href={`/${citySlug}/moments/${moment.slug}/edit`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
      >
        Edit Moment
      </Link>

      <div className="space-y-8">

        {/* Basics */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Basics</h2>
          <p><strong>Slug:</strong> {moment.slug}</p>

          <div>
            <strong>Body:</strong>
            <pre className="whitespace-pre-wrap border p-3 rounded mt-2">
              {moment.body || "—"}
            </pre>
          </div>
        </section>

        {/* Timeline */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <p>
            <strong>Moment Time:</strong>{" "}
            {moment.moment_time
              ? new Date(moment.moment_time).toLocaleString()
              : "—"}
          </p>
        </section>

        {/* 360° Visuals */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">360° Visuals</h2>

          <p><strong>Thumbnail 360° URL:</strong> {moment.thumbnail_360_url || "—"}</p>

          <div>
            <strong>Inline 360° URLs:</strong>
            {moment.inline_360_urls?.length ? (
              <ul className="list-disc ml-6 mt-2">
                {moment.inline_360_urls.map((url: string, idx: number) => (
                  <li key={idx}>{url}</li>
                ))}
              </ul>
            ) : (
              <p>—</p>
            )}
          </div>
        </section>

        {/* Publication */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Publication</h2>
          <p><strong>Published:</strong> {moment.is_published ? "Yes" : "No"}</p>
          <p><strong>Created At:</strong> {moment.created_at || "—"}</p>
          <p><strong>Updated At:</strong> {moment.updated_at || "—"}</p>
        </section>
      </div>

      <Link href={`/${citySlug}/moments`} className="text-blue-600 underline">
        Back to Moments
      </Link>
    </div>
  );
}
