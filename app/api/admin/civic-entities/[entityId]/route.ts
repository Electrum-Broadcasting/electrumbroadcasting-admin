import { NextResponse } from "next/server";
import { editCivicEntityMetadata, getCivicEntityActions } from "@/lib/admin/civicEntityMutations";
import { entityErrorResponse, readEntityBody } from "../response";

export async function GET(_request: Request, { params }: { params: { entityId: string } }) {
  try {
    return NextResponse.json({ actions: await getCivicEntityActions(params.entityId) });
  } catch (error) {
    return entityErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { entityId: string } }) {
  try {
    const result = await editCivicEntityMetadata(params.entityId, await readEntityBody(request));
    return NextResponse.json({ result });
  } catch (error) {
    return entityErrorResponse(error);
  }
}
