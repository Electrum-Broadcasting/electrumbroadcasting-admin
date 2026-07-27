"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function PageDelete({ params }: { params: { cityId: string; pageSlug: string } }) {
  const router = useRouter();

  const cityId = params.cityId;
  const pageSlug = params.pageSlug;

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
      setLoading(false);
    }

    loadPage();
  }, [cityId, pageSlug]);

  async function deletePage() {
    setDeleting(true);

    const { data, error } = await supabase
      .from("city_brand_settings")
      .select("pages")
      .eq("city_id", cityId)
      .single();

    if (error) {
      console.error("Error loading pages:", error);
      setDeleting(false);
      return;
    }

    const pages = data.pages || [];
    const updatedPages = pages.filter((p: any) => p.slug !== pageSlug);

    const { error: updateError } = await supabase
      .from("city_brand_settings")
      .update({ pages: updatedPages })
      .eq("city_id", cityId);

    if (updateError) {
      console.error("Error deleting page:", updateError);
      setDeleting(false);
      return;
    }

    router.push(`/admin/city/${cityId}/pages`);
  }

  if (loading) {
    return <div className="p-6">Loading delete confirmation…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-red-700">
        Delete Page: {page.title}
      </h1>

      <div className="border rounded p-4 bg-red-50 space-y-4">
        <p className="text-gray-800">
          You are about to permanently delete this page:
        </p>

        <div className="border rounded p-3 bg-white">
          <div className="font-medium">{page.title}</div>
          <div className="text-sm text-gray-500">/{page.slug}</div>
          <div className="text-xs text-gray-400">
            {page.modules?.length || 0} modules
          </div>
        </div>

        <p className="text-red-700 font-medium">
          This action cannot be undone.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => router.push(`/admin/city/${cityId}/pages/${pageSlug}`)}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={deletePage}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete Page"}
        </button>
      </div>
    </div>
  );
}
