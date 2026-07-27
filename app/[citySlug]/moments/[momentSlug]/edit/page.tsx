"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Moment {
  id: string;
  name: string;
  description?: string;
  date?: string;
  image_url?: string;
  slug: string;
}

export default function EditMomentPage({ params }: { params: { momentSlug: string } }) {
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

  async function save() {
    if (moment) {
      await supabase
        .from("moments")
        .update(moment)
        .eq("id", moment.id);
    }
  }

  if (!moment) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Moment</h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          value={moment.name}
          onChange={(e) => setMoment({ ...moment, name: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          value={moment.description || ""}
          onChange={(e) => setMoment({ ...moment, description: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          type="date"
          value={moment.date || ""}
          onChange={(e) => setMoment({ ...moment, date: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          value={moment.image_url || ""}
          onChange={(e) => setMoment({ ...moment, image_url: e.target.value })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
