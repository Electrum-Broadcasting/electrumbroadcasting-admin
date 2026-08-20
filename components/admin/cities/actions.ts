"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { CityFormPayload } from "./CityForm/CityFormTypes";

function normalizeNullableNumber(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return null;
  return Number.isFinite(value) ? value : null;
}

export async function updateCityAction(payload: CityFormPayload) {
  console.log("UPDATE CITY ACTION FIRED");
  console.log("PAYLOAD:", payload);
  const supabase = createSupabaseServerClient();

  const { error, data } = await supabase.rpc("admin_update_city", {
    p_id: payload.id,
    p_name: payload.name,
    p_slug: payload.slug,
    p_domain: payload.domain || null,
    p_status: payload.status ?? "draft",
    p_incorporated_year: normalizeNullableNumber(payload.incorporated_year),
    p_hero_image_url: payload.hero_image_url || null,
    p_country: payload.country || null,
    p_state_province: payload.state_province || null,
    p_latitude: normalizeNullableNumber(payload.latitude),
    p_longitude: normalizeNullableNumber(payload.longitude),
    p_population: normalizeNullableNumber(payload.population),
  });

  if (error) {
    console.error("Error updating city:", error);
  }

  return { error, data };
}

export async function createCityAction(payload: CityFormPayload) {
  const supabase = createSupabaseServerClient();

  const { error, data } = await supabase.rpc("admin_create_city", {
    p_name: payload.name,
    p_slug: payload.slug,
    p_domain: payload.domain || null,
    p_status: payload.status ?? "draft",
    p_incorporated_year: normalizeNullableNumber(payload.incorporated_year),
    p_hero_image_url: payload.hero_image_url || null,
    p_country: payload.country || null,
    p_state_province: payload.state_province || null,
    p_latitude: normalizeNullableNumber(payload.latitude),
    p_longitude: normalizeNullableNumber(payload.longitude),
    p_population: normalizeNullableNumber(payload.population),
  });

  return { error, data };
}
