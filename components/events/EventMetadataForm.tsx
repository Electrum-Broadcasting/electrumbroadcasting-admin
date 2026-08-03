"use client";

export default function EventMetadataForm({
  tags,
  setTags,
  thumbnail360Url,
  setThumbnail360Url,
  isPublished,
  setIsPublished,
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Metadata</h2>

      <div>
        <label className="block font-medium mb-1">Tags (comma-separated)</label>
        <input
          className="border p-2 w-full rounded"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Thumbnail 360° URL</label>
        <input
          className="border p-2 w-full rounded"
          value={thumbnail360Url}
          onChange={(e) => setThumbnail360Url(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Published
      </label>
    </div>
  );
}
