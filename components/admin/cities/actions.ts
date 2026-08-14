"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { CityFormPayload } from "./CityForm/CityFormTypes";

function normalizeNullableNumber(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return null;
  return Number.isFinite(value) ? value : null;
}

export async function updateCityAction(payload: CityFormPayload) {
  const supabase = createSupabaseServerClient();

  const { error, data } = await supabase.rpc("admin_update_city", {
    p_city_id: payload.id,
    p_name: payload.name,
    p_slug: payload.slug,
    p_domain: payload.domain || null,
    p_status: payload.status ?? "draft",
    p_incorporated_year: normalizeNullableNumber(payload.incorporated_year),
    p_country: payload.country || null,
    p_state_province: payload.state_province || null,
    p_latitude: normalizeNullableNumber(payload.latitude),
    p_longitude: normalizeNullableNumber(payload.longitude),
    p_population: normalizeNullableNumber(payload.population),
  });

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
    p_country: payload.country || null,
    p_state_province: payload.state_province || null,
    p_latitude: normalizeNullableNumber(payload.latitude),
    p_longitude: normalizeNullableNumber(payload.longitude),
    p_population: normalizeNullableNumber(payload.population),
  });

  return { error, data };
}
