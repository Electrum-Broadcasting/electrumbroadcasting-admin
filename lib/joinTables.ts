// lib/joinTables.ts

export async function replaceUnifiedRelationships(
  supabase: any,
  fromType: any,
  fromId: any,
  relationships: any
) {
  // 1. Delete existing
  await supabase
    .from("civic_relationships")
    .delete()
    .eq("from_type", fromType)
    .eq("from_id", fromId);

  if (!relationships || relationships.length === 0) return;

  // 2. Insert new
  const { error } = await supabase
    .from("civic_relationships")
    .insert(relationships);

  if (error) {
    console.error("REL INSERT ERROR:", error);
    throw error;
  }
}

export async function loadUnifiedRelationships(
  supabase: any,
  fromType: any,
  fromId: any
) {
  const { data } = await supabase
    .from("civic_relationships")
    .select("*")
    .eq("from_type", fromType)
    .eq("from_id", fromId);

  return data || [];
}
