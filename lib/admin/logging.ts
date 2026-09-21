import { SupabaseClient } from "@supabase/supabase-js";
import { getAdminContext } from "@/lib/admin/context";

export async function logAdminAction(
  supabase: SupabaseClient,
  admin: Awaited<ReturnType<typeof getAdminContext>>,
  {
    action,
    domain,
    entity_type,
    entity_id = null,
    target_user_id = null,
    metadata = {},
    ip_address = null,
    user_agent = null,
  }: {
    action: string;
    domain: string;
    entity_type: string;
    entity_id?: string | null;
    target_user_id?: string | null;
    metadata?: any;
    ip_address?: any;
    user_agent?: string | null;
  }
) {
  return supabase.rpc("log_admin_action", {
    actor_user_id: admin.user_id,
    actor_admin_id: admin.id,
    actor_role: admin.role,
    action,
    domain,
    entity_type,
    entity_id,
    target_user_id,
    metadata,
    ip_address,
    user_agent,
  });
}
