"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NeighborhoodPageProps {
  params: {
    citySlug: string;
    neighborhoodSlug: string;
  };
}

export default function NeighborhoodDetailPage({ params }: NeighborhoodPageProps) {
  const { neighborhoodSlug } = params;

  const [neighborhood, setNeighborhood] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("neighborhoods")
        .select("*")
        .eq("slug", neighborhoodSlug)
        .single();

      setNeighborhood(data);
    }

    load();
  }, [neighborhoodSlug]);

  if (!neighborhood) return <div className="p-6">Loading neighborhood…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold">{neighborhood.name}</h1>
      <p className="text-gray-600">{neighborhood.description}</p>
    </div>
  );
}
