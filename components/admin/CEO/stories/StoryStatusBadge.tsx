"use client";

import type { StoryRow } from "@/lib/admin/types";

export function StoryStatusBadge({ story }: { story: StoryRow }) {
  const isPublished = story.is_published === true;
  const isFrozen = story.is_frozen === true;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={[
          "inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
          isPublished
            ? "border-green-200 bg-green-100 text-green-800"
            : "border-red-200 bg-red-100 text-red-700",
        ].join(" ")}
      >
        {isPublished ? "Published" : "Hidden"}
      </span>

      <span
        className={[
          "inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
          isFrozen
            ? "border-blue-200 bg-blue-100 text-blue-800"
            : "border-slate-200 bg-slate-100 text-slate-700",
        ].join(" ")}
      >
        {isFrozen ? "Frozen" : "Active"}
      </span>
    </div>
  );
}
