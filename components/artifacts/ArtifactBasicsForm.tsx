"use client";

export default function ArtifactBasicsForm({
  title,
  setTitle,
  slug,
  setSlug,
  summary,
  setSummary,
  body,
  setBody,
}: {
  title: string;
  setTitle: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  summary: string;
  setSummary: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Artifact Basics</h2>

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

      <textarea
        placeholder="Body"
        className="w-full border p-2 rounded h-40"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
    </section>
  );
}
