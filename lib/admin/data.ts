import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminTableName } from "@/lib/admin/config";

export type RowData = Record<string, unknown>;

export async function listRows(table: AdminTableName, limit = 100): Promise<RowData[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from(table).select("*").limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RowData[];
}

export async function getRowById(table: AdminTableName, id: string): Promise<RowData | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as RowData | null) ?? null;
}

export async function insertRow(table: AdminTableName, values: RowData): Promise<RowData> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from(table).insert(values).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return data as RowData;
}

export async function updateRow(table: AdminTableName, id: string, values: RowData): Promise<RowData> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as RowData;
}

export async function removeRow(table: AdminTableName, id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getTableCount(table: AdminTableName): Promise<number> {
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
