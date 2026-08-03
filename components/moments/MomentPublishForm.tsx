"use client";

export default function MomentPublishForm({ isPublished, setIsPublished }: { isPublished: boolean; setIsPublished: (value: boolean) => void }) {
  return (
    <div className="border rounded p-4 space-y-4">
      <h2 className="text-xl font-semibold">Publish</h2>

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
