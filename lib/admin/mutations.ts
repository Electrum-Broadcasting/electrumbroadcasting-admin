// lib/admin/mutations.ts
// Centralized, audited mutation wrappers for admin CRUD operations.
// Every admin mutation should go through one of these helpers so that
// logAdminAction() is always called (see docs/ARCHITECTURE.md §4.2, §9).

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/logAdminAction";
import type { AdminContext } from "@/lib/admin/guards";

type SupabaseLike = ReturnType<typeof createSupabaseServerClient>;

export type AuditedMutationOptions = {
  /** Admin session performing the mutation (from requireAdminRole/getAdminContext). */
  context: AdminContext;
  /** Table being mutated, e.g. "cities", "city_brand_settings". */
  table: string;
  /** Action identifier logged to admin_action_logs, e.g. "create_city". */
  action: string;
  /** Logical domain, e.g. "city" | "global" | "fraud" | "sponsor" | "civic". */
  domain: string;
  /** Row id, when already known (e.g. updates/deletes). */
  entityId?: string | null;
  /** Extra context stored alongside the log entry. */
  metadata?: Record<string, unknown>;
  /** Optional pre-created Supabase client (defaults to the server client). */
  supabase?: SupabaseLike;
};

async function audit(
  supabase: SupabaseLike,
  options: AuditedMutationOptions,
  entityId: string | null
) {
  await logAdminAction(supabase, {
    actorUserId: options.context.user_id ?? options.context.auth_uid,
    actorRole: options.context.role,
    action: options.action,
    domain: options.domain,
    entityType: options.table,
    entityId,
    metadata: options.metadata,
  });
}

export async function auditedInsert(
  options: AuditedMutationOptions,
  values: Record<string, unknown>
) {
  const supabase = options.supabase ?? createSupabaseServerClient();
  const { data, error } = await supabase.from(options.table).insert(values).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  await audit(supabase, options, (data as { id?: string } | null)?.id ?? options.entityId ?? null);
  return data;
}

export async function auditedUpdate(
  options: AuditedMutationOptions & { entityId: string; idColumn?: string },
  values: Record<string, unknown>
) {
  const supabase = options.supabase ?? createSupabaseServerClient();
  const idColumn = options.idColumn ?? "id";

  const { data, error } = await supabase
    .from(options.table)
    .update(values)
    .eq(idColumn, options.entityId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  await audit(supabase, options, options.entityId);
  return data;
}

export async function auditedUpsert(
  options: AuditedMutationOptions,
  values: Record<string, unknown>,
  conflictColumn = "city_id"
) {
  const supabase = options.supabase ?? createSupabaseServerClient();
  const { data, error } = await supabase
    .from(options.table)
    .upsert(values, { onConflict: conflictColumn })
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  await audit(supabase, options, (data as { id?: string } | null)?.id ?? options.entityId ?? null);
  return data;
}

export async function auditedDelete(
  options: AuditedMutationOptions & { entityId: string; idColumn?: string }
) {
  const supabase = options.supabase ?? createSupabaseServerClient();
  const idColumn = options.idColumn ?? "id";

  const { error } = await supabase.from(options.table).delete().eq(idColumn, options.entityId);

  if (error) {
    throw new Error(error.message);
  }

  await audit(supabase, options, options.entityId);
}
