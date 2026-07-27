"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ReorderModules({ params }: { params: { cityId: string; pageSlug: string } }) {
  const router = useRouter();

  const cityId = params.cityId;
  const pageSlug = params.pageSlug;

  const [page, setPage] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const { data, error } = await supabase
        .from("city_brand_settings")
        .select("pages")
        .eq("city_id", cityId)
        .single();

      if (error) {
        console.error("Error loading pages:", error);
        return;
      }

      const pages = data.pages || [];
      const foundPage = pages.find((p: any) => p.slug === pageSlug);

      if (!foundPage) {
        console.error("Page not found:", pageSlug);
        return;
      }

      setPage(foundPage);
      setModules(foundPage.modules || []);
      setLoading(false);
    }

    loadPage();
  }, [cityId, pageSlug]);

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...modules];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setModules(updated);
  }

  function moveDown(index: number) {
    if (index === modules.length - 1) return;
    const updated = [...modules];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setModules(updated);
  }

  async function saveOrder() {
    setSaving(true);

    const { data, error } = await supabase
      .from("city_brand_settings")
      .select("pages")
      .eq("city_id", cityId)
      .single();

    if (error) {
      console.error("Error loading pages:", error);
      setSaving(false);
      return;
    }

    const pages = data.pages || [];

    const updatedPages = pages.map((p: any) =>
      p.slug === pageSlug ? { ...p, modules } : p
    );

    const { error: updateError } = await supabase
      .from("city_brand_settings")
      .update({ pages: updatedPages })
      .eq("city_id", cityId);

    if (updateError) {
      console.error("Error saving module order:", updateError);
      setSaving(false);
      return;
    }

    router.push(`/admin/city/${cityId}/pages/${pageSlug}`);
  }

  if (loading) {
    return <div className="p-6">Loading module order…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reorder Modules</h1>

      <div className="space-y-4">
        {modules.map((mod, index) => (
          <div
            key={index}
            className="border rounded p-4 flex justify-between items-center bg-gray-50"
          >
            <div>
              <div className="font-medium">
                {mod.type.charAt(0).toUpperCase() + mod.type.slice(1)} Module
              </div>
              <div className="text-xs text-gray-500">
                Position: {index + 1}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => moveUp(index)}
              >
                ↑ Move Up
              </button>

              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => moveDown(index)}
              >
                ↓ Move Down
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={saveOrder}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save Order"}
      </button>
    </div>
  );
}
