import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getBrandSettings() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("global_brand_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error loading brand settings:", error);
    throw new Error("Failed to load brand settings");
  }

  return data;
}
