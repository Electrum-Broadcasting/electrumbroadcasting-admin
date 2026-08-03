"use client";

import { useState } from "react";
import TiptapEditor from "@/components/editors/TiptapEditor";

interface StoryBasicsFormProps {
  title: string;
  setTitle: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  summary: string;
  setSummary: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;

  // ⭐ NEW — fixes your TypeScript error
  categoryOptions?: string[];
}

export default function StoryBasicsForm({
  title,
  setTitle,
  slug,
  setSlug,
  summary,
  setSummary,
  body,
  setBody,
  category,
  setCategory,
  tags,
  setTags,
  categoryOptions = [], // ⭐ NEW default
}: StoryBasicsFormProps) {
  const [inline360Urls, setInline360Urls] = useState<string[]>([]);
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Story Basics</h2>

      <input
        type="text"
        placeholder="Title"
        className="w-full border p-2 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="text"
        placeholder="Slug"
        className="w-full border p-2 rounded"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <textarea
        placeholder="Summary"
        className="w-full border p-2 rounded"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />

      <TiptapEditor
  content={body}
  onUpdate={setBody}
  onInsert360={(url) => setInline360Urls([...inline360Urls, url])}
/>

      {/* ⭐ NEW — Category Dropdown */}
      {categoryOptions.length > 0 ? (
        <select
          className="w-full border p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select a category…</option>
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder="Category"
          className="w-full border p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      )}

      <input
        type="text"
        placeholder="Tags (comma-separated)"
        className="w-full border p-2 rounded"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
    </section>
  );
}
