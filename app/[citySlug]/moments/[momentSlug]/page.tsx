"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Moment {
  name: string;
  date?: string;
  image_url?: string;
  description: string;
  [key: string]: any;
}

export default function MomentAdminDetailPage({ params }: { params: { momentSlug: string } }) {
  const { momentSlug } = params;

  const [moment, setMoment] = useState<Moment | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("moments")
        .select("*")
        .eq("slug", momentSlug)
        .single();

      setMoment(data);
    }

    load();
  }, [momentSlug]);

  if (!moment) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{moment.name}</h1>

      {moment.date && (
        <p className="text-gray-600">
          {new Date(moment.date).toLocaleDateString()}
        </p>
      )}

      {moment.image_url && (
        <img
          src={moment.image_url}
          alt={moment.name}
          className="rounded-lg shadow max-w-xl"
        />
      )}

      <p className="text-gray-700">{moment.description}</p>
    </div>
  );
}
