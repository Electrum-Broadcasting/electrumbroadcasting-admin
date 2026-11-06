"use client";

import type { AdminRole } from "@/lib/admin/types";
import { StoryModerationControls } from "@/components/admin/StoryModerationControls";

export default function AdminStoryToolbar({ storyId, role }: { storyId: string; role: AdminRole }) {
  return <StoryModerationControls storyId={storyId} role={role} />;
}
