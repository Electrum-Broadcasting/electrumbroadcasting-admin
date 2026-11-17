import { NextResponse } from "next/server";
import { CivicEntityMutationError, transitionCivicEntity } from "@/lib/admin/civicEntityMutations";
import { entityErrorResponse, readEntityBody } from "../../response";

export async function POST(
  request: Request,
  { params }: { params: { entityId: string; operation: string } },
) {
  try {
    const { operation } = params;
    if (operation !== "approve" && operation !== "hide" && operation !== "restore") {
      return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
    }
    const body = await readEntityBody(request, true);
    if (body === null || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0) {
      throw new CivicEntityMutationError("Lifecycle operations do not accept data", 400, "invalid_input");
    }
    return NextResponse.json({ result: await transitionCivicEntity(params.entityId, operation) });
  } catch (error) {
    return entityErrorResponse(error);
  }
}
