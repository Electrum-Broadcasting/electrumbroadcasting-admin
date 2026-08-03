"use client";

import TipTapEditor from "@/components/editors/TiptapEditor";

export default function MomentBasicsForm({
  title,
  setTitle,
  slug,
  setSlug,
  body,
  setBody,
}: {
  title: string;
  setTitle: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
}) {
  return (
    <div className="border rounded p-4 space-y-4">
      <h2 className="text-xl font-semibold">Basics</h2>

      <input
        className="border p-2 w-full"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="border p-2 w-full"
        placeholder="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <div>
        <label className="font-medium">Body</label>
        <TipTapEditor content={body} onUpdate={setBody} />
      </div>
    </div>
  );
}
