"use client";

interface StoryPublishFormProps {
  isPublished: boolean;
  setIsPublished: (value: boolean) => void;
}

export default function StoryPublishForm({
  isPublished,
  setIsPublished,
}: StoryPublishFormProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Publication</h2>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <span>Publish this story</span>
      </label>
    </section>
  );
}
