"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { CityStatus } from "./CityForm/CityFormTypes";


function normalizeNullableNumber(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return null;
  return Number.isFinite(value) ? value : null;
}

function formNumber(formData: FormData, key: string) {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw === "") return null;
  return normalizeNullableNumber(Number(raw));
}

function formText(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" && raw !== "" ? raw : null;
}

export async function updateCityAction(formData: FormData) {
  const cityId = formData.get("id") as string;
  const supabase = createSupabaseServerClient();
  let rpcErrorMessage: string | null = null;

  const payload = {
    city_id: cityId,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    domain: formText(formData, "domain"),
    status: (formData.get("status") as CityStatus) ?? "draft",
    incorporated_year: formNumber(formData, "incorporated_year"),
    country: formText(formData, "country"),
    state_province: formText(formData, "state_province"),
    latitude: formNumber(formData, "latitude"),
    longitude: formNumber(formData, "longitude"),
    population: formNumber(formData, "population"),
    metadata: {},
  };

  console.log("PAYLOAD:", payload);

  try {
    const result = await supabase.rpc("admin_update_city", payload);

    console.log("RPC RESULT:", result);

    if (result.error) {
      console.log("RPC ERROR:", result.error);
      rpcErrorMessage = result.error.message;
    }
  } catch (err) {
    console.log("RPC ERROR:", err);
    rpcErrorMessage = String(err);
  }

  if (rpcErrorMessage) {
    redirect(`/admin/CEO/cities/${cityId}?error=${encodeURIComponent(rpcErrorMessage)}`);
  }

  revalidatePath("/admin/CEO/cities");
  redirect("/admin/CEO/cities");
}

export async function createCityAction(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.rpc("admin_create_city", {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    domain: formText(formData, "domain"),
    status: (formData.get("status") as CityStatus) ?? "draft",
    incorporated_year: formNumber(formData, "incorporated_year"),
    country: formText(formData, "country"),
    state_province: formText(formData, "state_province"),
    latitude: formNumber(formData, "latitude"),
    longitude: formNumber(formData, "longitude"),
    population: formNumber(formData, "population"),
    metadata: {},
  });

  if (error) {
    redirect(`/admin/CEO/cities/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/CEO/cities");
  redirect("/admin/CEO/cities");
}

export async function deleteCityAction(cityId: string) {
  const supabase = createSupabaseServerClient();
  const { error, data } = await supabase.rpc("admin_delete_city", {
    city_id: cityId,
    metadata: {},
  });

  return { error, data };
}
