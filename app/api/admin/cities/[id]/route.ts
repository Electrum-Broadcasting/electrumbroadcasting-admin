import { NextResponse } from "next/server";
import { requireAdminRole, requireCityAccess, AdminAccessError } from "@/lib/admin/guards";
import { auditedUpdate, auditedDelete } from "@/lib/admin/mutations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, params.id);

    const body = await req.json();
    const { name, slug, domain, status } = body;

    await auditedUpdate(
      { context, table: "cities", action: "update_city", domain: "city", entityId: params.id },
      { name, slug, domain, status }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to update city:", error);
    return NextResponse.json({ error: "Failed to update city" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAdminRole("PLATFORM_ADMIN");

    await auditedDelete({
      context,
      table: "cities",
      action: "delete_city",
      domain: "city",
      entityId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to delete city:", error);
    return NextResponse.json({ error: "Failed to delete city" }, { status: 500 });
  }
}
