// lib/admin/types.ts

export type AdminRole =
  | "CEO"
  | "PLATFORM_ADMIN"
  | "CITY_ADMIN"
  | "EDITOR";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  city_ids: string[];
  status: "active" | "inactive";
}

export interface AdminContext {
  userId: string;
  email: string | null;
  role: AdminRole;
  cityIds: string[];
}

/**
 * Unified Story domain model
 * Shared across:
 * - City Admin Dashboard
 * - Safety Dashboard
 * - CEO Dashboard
 * - Story Drawer
 * - StoryDetails RPC (future)
 */
export interface Story {
  id: string;
  city_id: string;

  title: string | null;
  body: string | null;

  status: "published" | "hidden" | "draft" | null;
  category: string | null;

  created_at: string | null;
  updated_at: string | null;

  contributor_id: string | null;
  contributor_display_name: string | null;

  location_name: string | null;
  media_count: number | null;

  // Moderation metadata (optional)
  is_frozen?: boolean;
  is_flagged?: boolean;
  flagged_reason?: string | null;
}

export interface StoryRow {
  id: string;
  title: string;
  body: string | null;
  summary: string | null;
  author_name: string | null;
  published_at: string | null;
  primary_city_id: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  category: string | null;
  city: string | null;
  year: number | null;
  tags: string[] | null;
  image_description: string | null;
  related_place_ids: string[] | null;
  related_entity_ids: string[] | null;
  related_moment_ids: string[] | null;
  date_range: string | null;
  neighborhood: string | null;
  cross_city_links: string[] | null;
  entities: string[] | null;
  is_published: boolean | null;
  is_frozen: boolean | null;
  contributor_id: string | null;
}
