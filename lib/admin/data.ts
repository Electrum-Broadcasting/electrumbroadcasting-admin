import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTableConfig, type AdminTableName } from "@/lib/admin/config";

export type RowData = Record<string, unknown>;

function resolveTableName(table: AdminTableName, operation: string): string | null {
  const config = getTableConfig(table);

  if (!config?.key) {
    console.error("[admin:data] Missing table config key", { operation, table });
    return null;
  }

  if (config.key !== table) {
    console.error("[admin:data] Table key mismatch", {
      operation,
      table,
      configuredKey: config.key
    });
    return null;
  }

  return config.key;
}

export async function listRows(table: AdminTableName, limit = 100): Promise<RowData[]> {
  const supabase = createSupabaseServerClient();
  const tableName = resolveTableName(table, "listRows");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  const { data, error } = await supabase.from(tableName).select("*").limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RowData[];
}

export async function getRowById(table: AdminTableName, id: string): Promise<RowData | null> {
  const supabase = createSupabaseServerClient();
  const tableName = resolveTableName(table, "getRowById");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  const { data, error } = await supabase.from(tableName).select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as RowData | null) ?? null;
}

export async function insertRow(table: AdminTableName, values: RowData): Promise<RowData> {
  const supabase = createSupabaseServerClient();
  const tableName = resolveTableName(table, "insertRow");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  const { data, error } = await supabase.from(tableName).insert(values).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return data as RowData;
}

export async function updateRow(table: AdminTableName, id: string, values: RowData): Promise<RowData> {
  const supabase = createSupabaseServerClient();
  const tableName = resolveTableName(table, "updateRow");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  const { data, error } = await supabase
    .from(tableName)
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
  const tableName = resolveTableName(table, "removeRow");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  const { error } = await supabase.from(tableName).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getTableCount(table: AdminTableName): Promise<number> {
  const tableName = resolveTableName(table, "getTableCount");
  if (!tableName) {
    console.error("[admin:getTableCount] Invalid table configuration", { table });
    return 0;
  }

  const supabase = createSupabaseServerClient();

  try {
    const { count, error } = await supabase.from(tableName).select("id", { count: "exact", head: true });

    if (error) {
      console.error("[admin:getTableCount] Failed to fetch table count", {
        table,
        tableName,
        operation: "getTableCount",
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("[admin:getTableCount] Unexpected error", {
      table,
      tableName,
      message: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}
