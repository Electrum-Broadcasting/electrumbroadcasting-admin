"use client";

import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/lib/database.types";

export type StoryRow = Database["public"]["Tables"]["civic_stories"]["Row"];

type SafetyStoryRow = {
  id: string;
  title: string;
  city_id: string | null;
  is_published: boolean | null;
  is_frozen: boolean | null;
  review_status: string | null;
  safety_hold: boolean;
  safety_hold_notes: string | null;
};

export function useStories(citySlug: string) {
  const [stories, setStories] = useState<SafetyStoryRow[]>([]);
  const [error, setError] = useState("");
  const loadStories = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/cities/${encodeURIComponent(citySlug)}/stories`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Failed to load stories");
      if (!Array.isArray(body)) throw new Error("Invalid stories response");
      setStories(body);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
    }
  }, [citySlug]);
  useEffect(() => { void loadStories(); }, [loadStories]);
  return { stories, error, loadStories };
}
