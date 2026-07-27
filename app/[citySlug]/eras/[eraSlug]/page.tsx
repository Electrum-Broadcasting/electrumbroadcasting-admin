"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EraAdminDetailPage({ params }: { params: { eraSlug: string } }) {
  const { eraSlug } = params;

  const [era, setEra] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("civic_eras")
        .select("*")
        .eq("slug", eraSlug)
        .single();

      setEra(data);
    }

    load();
  }, [eraSlug]);

  if (!era) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{era.name}</h1>

      <p className="text-gray-600">
        {era.start_year} – {era.end_year || "Present"}
      </p>

      <p className="text-gray-700">{era.description}</p>

      {era.cultural_significance && (
        <p className="text-gray-700">{era.cultural_significance}</p>
      )}
    </div>
  );
}
