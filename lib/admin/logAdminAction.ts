// lib/admin/logAdminAction.ts

import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminActionParams = {
  actorUserId: string;          // auth.uid()
  actorAdminId?: string | null; // admin_users.id (if applicable)
  actorRole: string;            // 'ADMIN' | 'CITY_ADMIN' | 'EDITOR' | 'CONTRIBUTOR'
  action: string;               // e.g. 'update_city_brand_settings'
  domain: string;               // e.g. 'city' | 'global' | 'fraud' | 'sponsor' | 'civic'
  entityType: string | null;    // table name, e.g. 'city_brand_settings'
  entityId: string | null;      // row id
  targetUserId?: string | null; // when acting on another user
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAdminAction(
  // Accepts any Supabase client flavor (browser/server/service-role), since
  // callers use different client factories across @supabase/supabase-js and @supabase/ssr.
  supabase: SupabaseClient<any, any, any>,
  params: AdminActionParams
) {
  const {
    actorUserId,
    actorAdminId = null,
    actorRole,
    action,
    domain,
    entityType,
    entityId,
    targetUserId = null,
    metadata = {},
    ipAddress = null,
    userAgent = null
  } = params;

  const { error } = await supabase.rpc('log_admin_action', {
    p_actor_user_id: actorUserId,
    p_actor_admin_id: actorAdminId,
    p_actor_role: actorRole,
    p_action: action,
    p_domain: domain,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_target_user_id: targetUserId,
    p_metadata: metadata,
    p_ip_address: ipAddress,
    p_user_agent: userAgent
  });

  if (error) {
    console.error('Failed to log admin action:', error);
  }
}
