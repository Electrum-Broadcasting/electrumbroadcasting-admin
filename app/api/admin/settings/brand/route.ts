import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { logAdminAction } from "@/lib/admin/logging";
import { validateTheme } from "@/lib/themes/validateTheme";

function isThemeObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function canManageGlobalSettings(role: string) {
  return role === "CEO" || role === "PLATFORM_ADMIN";
}

export async function GET() {
  const admin = await getAdminContext();
  if (!canManageGlobalSettings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const [draft, published] = await Promise.all([
      supabase
        .from("global_brand_settings")
        .select("id, status, theme_json, logo_asset_id, updated_at")
        .eq("status", "draft")
        .maybeSingle(),
      supabase
        .from("global_brand_settings")
        .select("id, status, theme_json, logo_asset_id, updated_at")
        .eq("status", "published")
        .maybeSingle(),
    ]);

    const failure = draft.error ?? published.error;
    if (failure) {
      console.error("Failed to fetch global brand themes:", failure);
      return NextResponse.json(
        { error: "Failed to fetch global brand themes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      draft: draft.data,
      published: published.data,
    });
  } catch (error) {
    console.error("Global brand settings GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch global brand settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminContext();
  if (!canManageGlobalSettings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json({ error: "Invalid brand settings payload" }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;
    const action = payload.action;
    const supabase = createSupabaseServerClient();
    let rowId: string | null = null;
    let actionName: string;
    let updatedFields: Record<string, unknown>;

    if (action === "save_draft") {
      if (!isThemeObject(payload.theme_json)) {
        return NextResponse.json({ error: "A valid theme_json object is required" }, { status: 400 });
      }
      const validationError = validateTheme(payload.theme_json);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("global_brand_settings")
        .update({
          theme_json: payload.theme_json,
          updated_at: new Date().toISOString(),
          updated_by: admin.user_id,
        })
        .eq("status", "draft")
        .select("id")
        .maybeSingle();
      if (error || !data) {
        console.error("Failed to save global brand draft:", error);
        return NextResponse.json(
          { error: error ? "Failed to save global brand draft" : "Draft brand settings row not found" },
          { status: error ? 500 : 409 }
        );
      }
      rowId = data.id;
      actionName = "BRAND_DRAFT_UPDATE";
      updatedFields = { theme_json: payload.theme_json };
    } else if (action === "publish") {
      if (
        !isThemeObject(payload.theme_json) ||
        (payload.logo_asset_id !== undefined &&
          payload.logo_asset_id !== null &&
          typeof payload.logo_asset_id !== "string")
      ) {
        return NextResponse.json({ error: "A valid theme_json object is required" }, { status: 400 });
      }
      const validationError = validateTheme(payload.theme_json);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("global_brand_settings")
        .update({
          theme_json: payload.theme_json,
          ...(payload.logo_asset_id !== undefined
            ? { logo_asset_id: payload.logo_asset_id }
            : {}),
          updated_at: new Date().toISOString(),
          updated_by: admin.user_id,
        })
        .in("status", ["draft", "published"])
        .select("id, status");
      const draftRow = data?.find((row) => row.status === "draft");
      const publishedRow = data?.find((row) => row.status === "published");
      if (error || !draftRow || !publishedRow) {
        console.error("Failed to publish global brand theme:", error);
        return NextResponse.json(
          { error: error ? "Failed to publish global brand theme" : "Draft and published brand settings rows are required" },
          { status: error ? 500 : 409 }
        );
      }
      rowId = publishedRow.id;
      actionName = "BRAND_PUBLISH";
      updatedFields = {
        theme_json: payload.theme_json,
        ...(payload.logo_asset_id !== undefined
          ? { logo_asset_id: payload.logo_asset_id }
          : {}),
      };
    } else if (action === "save_logo") {
      if (
        payload.logo_asset_id !== null &&
        typeof payload.logo_asset_id !== "string"
      ) {
        return NextResponse.json({ error: "Invalid logo asset id" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("global_brand_settings")
        .update({
          logo_asset_id: payload.logo_asset_id,
          updated_at: new Date().toISOString(),
          updated_by: admin.user_id,
        })
        .eq("status", "draft")
        .select("id")
        .maybeSingle();
      if (error || !data) {
        console.error("Failed to save global brand logo:", error);
        return NextResponse.json(
          { error: error ? "Failed to save global brand logo" : "Draft brand settings row not found" },
          { status: error ? 500 : 409 }
        );
      }
      rowId = data.id;
      actionName = "BRAND_LOGO_UPDATE";
      updatedFields = { logo_asset_id: payload.logo_asset_id };
    } else {
      return NextResponse.json({ error: "Unsupported brand settings action" }, { status: 400 });
    }

    const { error: auditError } = await logAdminAction(supabase, admin, {
      action: actionName,
      domain: "brand",
      entity_type: "global_brand_settings",
      entity_id: rowId,
      metadata: { updated_fields: updatedFields },
    });
    if (auditError) {
      console.error("Brand settings updated but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Brand settings were updated, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Global brand settings update failed:", error);
    return NextResponse.json(
      { error: "Failed to update global brand settings" },
      { status: 500 }
    );
  }
}
