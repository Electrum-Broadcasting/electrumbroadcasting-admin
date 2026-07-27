"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PageEditor({ params }: { params: { cityId: string; pageSlug: string } }) {
  const router = useRouter();
  const cityId = params.cityId;
  const pageSlug = params.pageSlug;

  const [pageData, setPageData] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(pageSlug);
  const [modules, setModules] = useState<Array<{ type: string; limit: number; [key: string]: any }>>([]);
  const [loading, setLoading] = useState(true);

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
      const page = pages.find((p: any) => p.slug === pageSlug);

      if (!page) {
        console.error("Page not found:", pageSlug);
        return;
      }

      setPageData(page);
      setTitle(page.title);
      setSlug(page.slug);
      setModules(page.modules || []);
      setLoading(false);
    }

    loadPage();
  }, [cityId, pageSlug]);

  async function savePage() {
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

    const updatedPages = pages.map((p: any) =>
      p.slug === pageSlug
        ? { ...p, title, slug, modules }
        : p
    );

    const { error: updateError } = await supabase
      .from("city_brand_settings")
      .update({ pages: updatedPages })
      .eq("city_id", cityId);

    if (updateError) {
      console.error("Error saving page:", updateError);
      return;
    }

    router.push(`/admin/city/${cityId}/pages`);
  }

  function addModule(type: string) {
    const newModule = {
      type,
      limit: 6,
    };

    setModules([...modules, newModule]);
  }

  function updateModule(index: number, field: string, value: any) {
    const updated = [...modules];
    updated[index][field] = value;
    setModules(updated);
  }

  function deleteModule(index: number) {
    const updated = modules.filter((_, i) => i !== index);
    setModules(updated);
  }

  function moveModuleUp(index: number) {
    if (index === 0) return;
    const updated = [...modules];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setModules(updated);
  }

  function moveModuleDown(index: number) {
    if (index === modules.length - 1) return;
    const updated = [...modules];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setModules(updated);
  }

  if (loading) {
    return <div className="p-6">Loading page editor…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Edit Page</h1>

      {/* Page Settings */}
      <div className="space-y-4 border rounded p-4">
        <h2 className="text-lg font-medium">Page Settings</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Title</label>
          <input
            className="border rounded p-2 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Slug</label>
          <input
            className="border rounded p-2 w-full"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4 border rounded p-4">
        <h2 className="text-lg font-medium">Modules</h2>

        {modules.length === 0 && (
          <div className="text-gray-500">No modules added yet.</div>
        )}

        <div className="space-y-4">
          {modules.map((mod, index) => (
            <div
              key={index}
              className="border rounded p-4 space-y-3 bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">
                  {mod.type.charAt(0).toUpperCase() + mod.type.slice(1)} Module
                </div>

                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 bg-gray-200 rounded"
                    onClick={() => moveModuleUp(index)}
                  >
                    ↑
                  </button>
                  <button
                    className="px-2 py-1 bg-gray-200 rounded"
                    onClick={() => moveModuleDown(index)}
                  >
                    ↓
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    onClick={() => deleteModule(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Module Config */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Limit</label>
                <input
                  type="number"
                  className="border rounded p-2 w-full"
                  value={mod.limit || 6}
                  onChange={(e) =>
                    updateModule(index, "limit", Number(e.target.value))
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Module */}
        <div className="flex gap-3">
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded"
            onClick={() => addModule("stories")}
          >
            Add Stories Module
          </button>

          <button
            className="px-3 py-2 bg-blue-600 text-white rounded"
            onClick={() => addModule("civic_places")}
          >
            Add Places Module
          </button>

          <button
            className="px-3 py-2 bg-blue-600 text-white rounded"
            onClick={() => addModule("timeline")}
          >
            Add Timeline Module
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={savePage}
      >
        Save Page
      </button>
    </div>
  );
}
