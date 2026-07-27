"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ModuleEditorParams {
  cityId: string;
  pageSlug: string;
  moduleIndex: string;
}

export default function ModuleEditor({ params }: { params: ModuleEditorParams }) {
  const router = useRouter();

  const cityId = params.cityId;
  const pageSlug = params.pageSlug;
  const moduleIndex = Number(params.moduleIndex);

  const [page, setPage] = useState<any>(null);
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadModule() {
      const { data, error } = await supabase
        .from("city_brand_settings")
        .select("pages")
        .eq("city_id", cityId)
        .single();

      if (error) {
        console.error("Error loading pages:", error);
        return;
      }

      const pages: any[] = data.pages || [];
      const foundPage = pages.find((p: any) => p.slug === pageSlug);

      if (!foundPage) {
        console.error("Page not found:", pageSlug);
        return;
      }

      setPage(foundPage);

      const mod = foundPage.modules?.[moduleIndex];
      if (!mod) {
        console.error("Module not found:", moduleIndex);
        return;
      }

      setModuleData(mod);
      setLoading(false);
    }

    loadModule();
  }, [cityId, pageSlug, moduleIndex]);

  function updateField(field: string, value: any) {
    setModuleData({
      ...moduleData,
      [field]: value,
    });
  }

  async function saveModule() {
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
    const updatedPages = pages.map((p: any) => {
      if (p.slug !== pageSlug) return p;

      const updatedModules = [...p.modules];
      updatedModules[moduleIndex] = moduleData;

      return {
        ...p,
        modules: updatedModules,
      };
    });

    const { error: updateError } = await supabase
      .from("city_brand_settings")
      .update({ pages: updatedPages })
      .eq("city_id", cityId);

    if (updateError) {
      console.error("Error saving module:", updateError);
      setSaving(false);
      return;
    }

    router.push(`/admin/city/${cityId}/pages/${pageSlug}`);
  }

  if (loading) {
    return <div className="p-6">Loading module editor…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Edit Module #{moduleIndex + 1}
      </h1>

      <div className="border rounded p-4 space-y-4">
        <h2 className="text-lg font-medium">Module Type</h2>
        <div className="text-gray-700">{moduleData.type}</div>
      </div>

      {/* Shared Fields */}
      <div className="border rounded p-4 space-y-4">
        <h2 className="text-lg font-medium">General Settings</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Limit</label>
          <input
            type="number"
            className="border rounded p-2 w-full"
            value={moduleData.limit || 6}
            onChange={(e) => updateField("limit", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {moduleData.type === "stories" && (
        <div className="border rounded p-4 space-y-4">
          <h2 className="text-lg font-medium">Stories Module Settings</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Sort Order</label>
            <select
              className="border rounded p-2 w-full"
              value={moduleData.sort || "newest"}
              onChange={(e) => updateField("sort", e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </div>
      )}

      {moduleData.type === "civic_places" && (
        <div className="border rounded p-4 space-y-4">
          <h2 className="text-lg font-medium">Places Module Settings</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Sort Order</label>
            <select
              className="border rounded p-2 w-full"
              value={moduleData.sort || "alphabetical"}
              onChange={(e) => updateField("sort", e.target.value)}
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="featured">Featured</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      )}

      {moduleData.type === "timeline" && (
        <div className="border rounded p-4 space-y-4">
          <h2 className="text-lg font-medium">Timeline Module Settings</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Era Range</label>
            <input
              className="border rounded p-2 w-full"
              value={moduleData.eraRange || ""}
              onChange={(e) => updateField("eraRange", e.target.value)}
              placeholder="e.g. 1850-1920"
            />
          </div>
        </div>
      )}

      {/* Save */}
      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={saveModule}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save Module"}
      </button>
    </div>
  );
}
