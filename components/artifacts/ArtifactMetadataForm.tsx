"use client";

export default function ArtifactMetadataForm({
  year,
  setYear,
  tags,
  setTags,
}: {
  year: number | null;
  setYear: (year: number) => void;
  tags: string;
  setTags: (tags: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Artifact Metadata</h2>

      <input
        type="number"
        placeholder="Year"
        className="w-full border p-2 rounded"
        value={year || ""}
        onChange={(e) => setYear(Number(e.target.value))}
      />

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
