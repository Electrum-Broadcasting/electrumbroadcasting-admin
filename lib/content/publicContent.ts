import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublicContent() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("global_content_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error loading public content:", error);
    throw new Error("Failed to load public content");
  }

  return data;
}
