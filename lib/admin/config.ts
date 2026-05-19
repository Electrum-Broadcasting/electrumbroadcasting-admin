import type { AdminTableConfig } from "@/lib/admin/types";

export const adminTables = {
  cities: {
    key: "cities",
    label: "Cities",
    route: "/admin/cities",
    titleField: "name",
    fields: [
      { name: "id", label: "ID", type: "text", readOnly: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Is Active", type: "boolean" }
    ]
  },

  themes: {
    key: "themes",
    label: "City Themes",
    route: "/admin/city-themes",
    titleField: "city_id",
    fields: [
      { name: "id", label: "ID", type: "text", readOnly: true },
      { name: "city_id", label: "City ID", type: "text" },
      { name: "draft_theme", label: "Draft Theme", type: "json" },
      { name: "published_theme", label: "Published Theme", type: "json" }
    ]
  },

  places: {
    key: "places",
    label: "Places",
    route: "/admin/places",
    titleField: "name",
    fields: [
      { name: "id", label: "ID", type: "text", readOnly: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "city_id", label: "City ID", type: "text" },
      { name: "address", label: "Address", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" }
    ]
  },

  stories: {
    key: "stories",
    label: "Stories",
    route: "/admin/stories",
    titleField: "title",
    fields: [
      { name: "id", label: "ID", type: "text", readOnly: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "content", label: "Content", type: "textarea" },
      { name: "city_id", label: "City ID", type: "text" },
      { name: "published_at", label: "Published At", type: "date" },
      { name: "is_published", label: "Is Published", type: "boolean" }
    ]
  },

  scores: {
    key: "scores",
    label: "Game Scores",
    route: "/admin/game-scores",
    titleField: "id",
    fields: [
      { name: "id", label: "ID", type: "text", readOnly: true },
      { name: "story_id", label: "Story ID", type: "text" },
      { name: "place_id", label: "Place ID", type: "text" },
      { name: "score", label: "Score", type: "number", required: true },
      { name: "label", label: "Label", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" }
    ]
  },

  media_assets: {
    key: "media_assets",
    label: "Media Assets",
    route: "/admin/media-assets",
    titleField: "url",
    fields: [
      { name: "id", label: "ID", type: "text", readOnly: true },
      { name: "story_id", label: "Story ID", type: "text" },
      { name: "place_id", label: "Place ID", type: "text" },
      { name: "url", label: "URL", type: "text", required: true },
      { name: "alt_text", label: "Alt Text", type: "text" },
      { name: "type", label: "Type", type: "text" },
      { name: "metadata", label: "Metadata (JSON)", type: "json" }
    ]
  },

  admin_roles: {
    key: "admin_roles",
    label: "Admin Roles",
    route: "/admin/admin-users",
    titleField: "user_id",
    fields: [
      { name: "id", label: "ID", type: "text", readOnly: true },
      { name: "user_id", label: "User ID", type: "text", required: true },
      { name: "role", label: "Role", type: "text", required: true },
      { name: "city_ids", label: "City IDs", type: "json" }
    ]
  }
};

export type AdminTableName = keyof typeof adminTables;

export function getTableConfig(table: AdminTableName) {
  return adminTables[table];
}
