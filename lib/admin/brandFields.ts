// lib/admin/brandFields.ts
// Canonical city_brand_settings shape per docs/DATA-MODEL.md.
// Deprecated fields below must never be read/written from admin loaders,
// server actions, or API routes. Theme data now lives exclusively on
// city_design_system.draft_theme / published_theme.

export const DEPRECATED_BRAND_FIELDS = [
  "theme",
  "theme_status",
  "theme_updated_at",
  "accent_color",
  "accent_color_secondary",
  "typography",
  "motion",
  "city_logo_asset_id",
  "homepage_hero_asset_id",
  "editorial_tone",
  "future_concepts",
  "population",
  "city_motif_json",
] as const;

export type DeprecatedBrandField = (typeof DEPRECATED_BRAND_FIELDS)[number];

/** Strips deprecated city_brand_settings fields from an arbitrary payload. */
export function sanitizeBrandFields<T extends Record<string, unknown>>(
  fields: T
): Omit<T, DeprecatedBrandField> {
  const clean: Record<string, unknown> = { ...fields };
  for (const field of DEPRECATED_BRAND_FIELDS) {
    delete clean[field];
  }
  return clean as Omit<T, DeprecatedBrandField>;
}
