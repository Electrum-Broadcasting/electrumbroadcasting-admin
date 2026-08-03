// lib/joinTables.ts

export async function replaceJoinTable(
  supabase,
  tableName,
  momentId,
  columnName,
  selectedIds
) {
  // Delete existing rows
  await supabase
    .from(tableName)
    .delete()
    .eq("moment_id", momentId);

  // Insert new rows
  if (selectedIds.length > 0) {
    const rows = selectedIds.map((id) => ({
      moment_id: momentId,
      [columnName]: id,
    }));

    await supabase.from(tableName).insert(rows);
  }
}

export async function replaceUnifiedRelationships(
  supabase,
  fromType,
  fromId,
  relationships
) {
  // Delete existing
  await supabase
    .from("civic_relationships")
    .delete()
    .eq("from_type", fromType)
    .eq("from_id", fromId);

  // Insert new
  if (relationships.length > 0) {
    await supabase.from("civic_relationships").insert(relationships);
  }
}

export async function loadUnifiedRelationships(
  supabase,
  fromType,
  fromId
) {
  const { data } = await supabase
    .from("civic_relationships")
    .select("*")
    .eq("from_type", fromType)
    .eq("from_id", fromId);

  return data || [];
}
