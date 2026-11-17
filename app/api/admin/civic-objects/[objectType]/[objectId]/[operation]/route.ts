import { NextResponse } from "next/server";
import { CivicObjectMutationError, parseCivicObjectType, transitionCivicObject } from "@/lib/admin/civicObjectMutations";
import { civicObjectErrorResponse, readCivicObjectBody } from "../../../response";

export async function POST(
  request: Request,
  { params }: { params: { objectType: string; objectId: string; operation: string } },
) {
  try {
    const type = parseCivicObjectType(params.objectType);
    const { operation } = params;
    if (operation !== "approve" && operation !== "hide" && operation !== "restore") {
      return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
    }
    const body = await readCivicObjectBody(request, true);
    if (body === null || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0) {
      throw new CivicObjectMutationError("Lifecycle operations do not accept data", 400, "invalid_input");
    }
    return NextResponse.json({ result: await transitionCivicObject(type, params.objectId, operation) });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}
