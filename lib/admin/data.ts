import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTableConfig, type AdminTableName } from "@/lib/admin/config";
import { auditedInsert, auditedUpdate, auditedDelete } from "@/lib/admin/mutations";
import type { AdminContext } from "@/lib/admin/guards";

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

export async function insertRow(table: AdminTableName, values: RowData, context: AdminContext): Promise<RowData> {
  const tableName = resolveTableName(table, "insertRow");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  const data = await auditedInsert(
    { context, table: tableName, action: `create_${table}`, domain: "admin_table" },
    values
  );

  return data as RowData;
}

export async function updateRow(
  table: AdminTableName,
  id: string,
  values: RowData,
  context: AdminContext
): Promise<RowData> {
  const tableName = resolveTableName(table, "updateRow");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  const data = await auditedUpdate(
    { context, table: tableName, action: `update_${table}`, domain: "admin_table", entityId: id },
    values
  );

  return data as RowData;
}

export async function removeRow(table: AdminTableName, id: string, context: AdminContext): Promise<void> {
  const tableName = resolveTableName(table, "removeRow");

  if (!tableName) {
    throw new Error(`Invalid table configuration for ${table}`);
  }

  await auditedDelete({ context, table: tableName, action: `delete_${table}`, domain: "admin_table", entityId: id });
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
