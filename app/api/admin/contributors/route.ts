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

type ContributorSafety = {
  id: string;
  city: string;
  fraud_score: number;
  fraud_level: string;
  locked: boolean;
};

export async function GET() {
  const admin = await getAdminContext();
  if (!canManageContributors(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const [contributors, cities, safety] = await Promise.all([
      supabase
        .from("contributors")
        .select("id, display_name, email, bio, avatar_url, city_id, is_active, created_at, updated_at")
        .is("deleted_at", null)
        .order("display_name", { ascending: true }),
      supabase.from("cities").select("id, name").order("name", { ascending: true }),
      supabase.rpc("admin_get_contributors"),
    ]);

    const failedQuery = [contributors, cities, safety].find((result) => result.error);
    if (failedQuery?.error) {
      console.error("Failed to load contributor records:", failedQuery.error);
      return NextResponse.json(
        { error: "Failed to load contributors" },
        { status: 500 }
      );
    }

    const cityById = new Map((cities.data ?? []).map((city) => [city.id, city.name]));
    const safetyById = new Map<string, ContributorSafety>(
      (safety.data ?? []).map((row: ContributorSafety) => [row.id, row] as const)
    );
    const rows = (contributors.data ?? []).map((contributor) => {
      const safetyRow = safetyById.get(contributor.id);
      return {
        ...contributor,
        city: contributor.city_id
          ? cityById.get(contributor.city_id) ?? safetyRow?.city ?? "Unknown city"
          : "Unassigned",
        fraud_score: safetyRow?.fraud_score ?? null,
        fraud_level: safetyRow?.fraud_level ?? null,
        locked: safetyRow?.locked ?? false,
      };
    });

    return NextResponse.json({ contributors: rows, cities: cities.data ?? [] });
  } catch (error) {
    console.error("Contributor list request failed:", error);
    return NextResponse.json(
      { error: "Failed to load contributors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await getAdminContext();
  if (!canManageContributors(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const isActive = body.is_active === undefined ? true : body.is_active;

    if (
      displayName.length < 1 ||
      displayName.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      (bio.length > 5000) ||
      (cityId !== null && typeof cityId !== "string") ||
      (avatarUrl !== null && typeof avatarUrl !== "string") ||
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid contributor fields" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from("contributors")
      .insert({
        display_name: displayName,
        email,
        bio,
        city_id: cityId,
        avatar_url: avatarUrl,
        is_active: isActive,
        updated_by: admin.user_id,
      })
      .select("id, display_name, email, bio, avatar_url, city_id, is_active")
      .single();

    if (error) {
      console.error("Failed to create contributor:", error);
      return NextResponse.json(
        { error: "Failed to create contributor" },
        { status: 500 }
      );
    }

    const { error: auditError } = await supabase.rpc("log_admin_action", {
      actor_user_id: admin.user_id,
      actor_admin_id: admin.id ?? null,
      actor_role: admin.role,
      action: "CONTRIBUTOR_CREATE",
      domain: "contributors",
      entity_type: "contributor",
      entity_id: data.id,
      target_user_id: null,
      metadata: { email, city_id: cityId },
      ip_address: null,
      user_agent: request.headers.get("user-agent"),
    });

    if (auditError) {
      console.error("Contributor created but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Contributor was created, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contributor: data }, { status: 201 });
  } catch (error) {
    console.error("Contributor creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create contributor" },
      { status: 500 }
    );
  }
}
