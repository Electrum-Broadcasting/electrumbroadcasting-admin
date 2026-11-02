import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminContext } from "@/lib/admin/context";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

function canManageContributors(role: string) {
  return role === "CEO" || role === "PLATFORM_ADMIN";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!canManageContributors(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: "Invalid contributor id" }, { status: 400 });
  }

  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid contributor data" }, { status: 400 });
    }

    const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const cityId = body.city_id === "" ? null : body.city_id;
    const avatarUrl = body.avatar_url === "" ? null : body.avatar_url;
    const isActive = body.is_active;

    if (
      displayName.length < 1 ||
      displayName.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      bio.length > 5000 ||
      (cityId !== null && typeof cityId !== "string") ||
      (avatarUrl !== null && typeof avatarUrl !== "string") ||
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid contributor fields" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from("contributors")
      .update({
        display_name: displayName,
        email,
        bio,
        city_id: cityId,
        avatar_url: avatarUrl,
        is_active: isActive,
        updated_at: new Date().toISOString(),
        updated_by: admin.user_id,
      })
      .eq("id", params.id)
      .select("id, display_name, email, bio, avatar_url, city_id, is_active")
      .maybeSingle();

    if (error) {
      console.error("Failed to update contributor:", error);
      return NextResponse.json(
        { error: "Failed to update contributor" },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Contributor not found" }, { status: 404 });
    }

    const { error: auditError } = await supabase.rpc("log_admin_action", {
      actor_user_id: admin.user_id,
      actor_admin_id: admin.id ?? null,
      actor_role: admin.role,
      action: "CONTRIBUTOR_PROFILE_UPDATE",
      domain: "contributors",
      entity_type: "contributor",
      entity_id: data.id,
      target_user_id: null,
      metadata: { email, city_id: cityId, is_active: isActive },
      ip_address: null,
      user_agent: request.headers.get("user-agent"),
    });

    if (auditError) {
      console.error("Contributor updated but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Contributor was updated, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contributor: data });
  } catch (error) {
    console.error("Contributor profile update failed:", error);
    return NextResponse.json(
      { error: "Failed to update contributor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!canManageContributors(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: "Invalid contributor id" }, { status: 400 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const reason =
      isRecord(body) && typeof body.reason === "string"
        ? body.reason.trim().slice(0, 500) || null
        : null;

    // Soft delete only: the RPC sets deleted_at/deleted_by, deactivates, and logs atomically.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.rpc("admin_soft_delete_contributor", {
      p_contributor_id: params.id,
      p_actor_user_id: admin.user_id,
      p_actor_admin_id: admin.id ?? null,
      p_actor_role: admin.role,
      p_reason: reason,
    });
    if (error) {
      console.error("Failed to soft delete contributor:", error);
      const notFound = /not found|already deleted/i.test(error.message);
      return NextResponse.json(
        { error: notFound ? "Contributor not found or already deleted" : "Failed to delete contributor" },
        { status: notFound ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contributor soft delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete contributor" },
      { status: 500 }
    );
  }
}
