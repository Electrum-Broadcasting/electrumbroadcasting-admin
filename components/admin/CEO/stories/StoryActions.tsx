"use client";

import { StoryModerationControls } from "@/components/admin/StoryModerationControls";
import type { StoryRow } from "@/lib/admin/types";

export function StoryActions({ story }: { story: StoryRow }) {
  return <StoryModerationControls storyId={story.id} role="PLATFORM_ADMIN" />;
}
