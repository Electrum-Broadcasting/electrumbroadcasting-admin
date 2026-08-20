export type CityStatus = "draft" | "published";

export type CityFormPayload = {
  id?: string;
  name: string;
  slug: string;
  domain: string;
  status: CityStatus;
  incorporated_year: number | null;
  description: string | null;
  /**
   * Deprecated legacy fallback for the homepage hero.
   * Visual identity now comes from city_design_system.published_theme and city_brand_settings.homepage_hero_asset_id.
   */
  hero_image_url?: string | null;
  country: string | null;
  state_province: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
};

export type CityFormValue = {
  id?: string;
  name?: string;
  slug?: string;
  domain?: string;
  status?: CityStatus;
  incorporated_year?: number | null;
  description?: string | null;
  /**
   * Deprecated legacy fallback for the homepage hero.
   * Visual identity now comes from city_design_system.published_theme and city_brand_settings.homepage_hero_asset_id.
   */
  hero_image_url?: string | null;
  country?: string | null;
  state_province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  population?: number | null;
};

export type CityFormProps = {
  mode: "create" | "edit";
  city?: CityFormValue | null;
};
