"use client";

import { useState } from "react";
import type { AdminRole } from "@/lib/admin/types";
import { StoryModerationControls } from "@/components/admin/StoryModerationControls";
import { useStories } from "./useStories";

export function CitySafetyDashboard({ citySlug, role }: { citySlug: string; role: AdminRole }) {
  const { stories, error, loadStories } = useStories(citySlug);
  const [selectedId, setSelectedId] = useState("");
  const story = stories.find((item) => item.id === selectedId);
  return (
    <div className="space-y-4">
      <p>Contributor and fraud controls are temporarily unavailable.</p>
      <h2 className="text-lg font-semibold">Stories</h2>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <label className="block">Select story
        <select className="block border rounded p-2" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          <option value="">Select a story</option>
          {stories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      {story && <div className="space-y-2">
        <p>{story.is_published ? "Published" : "Not published"}; {story.safety_hold ? "Safety hold active" : "No safety hold"}</p>
        <StoryModerationControls key={story.id} storyId={story.id} role={role} onComplete={() => void loadStories()} />
      </div>}
    </div>
  );
}
