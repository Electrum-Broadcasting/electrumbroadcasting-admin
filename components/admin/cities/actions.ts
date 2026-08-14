"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateCityAction(payload: any) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.rpc("admin_update_city", payload);

  return { error };
}

export async function createCityAction(payload: any) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.rpc("admin_create_city", payload);

  return { error };
}
