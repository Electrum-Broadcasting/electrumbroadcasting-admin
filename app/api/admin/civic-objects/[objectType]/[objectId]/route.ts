import { NextResponse } from "next/server";
import { editCivicObjectMetadata, getCivicObjectActions, parseCivicObjectType } from "@/lib/admin/civicObjectMutations";
import { civicObjectErrorResponse, readCivicObjectBody } from "../../response";

type Params = { params: { objectType: string; objectId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    return NextResponse.json({ actions: await getCivicObjectActions(parseCivicObjectType(params.objectType), params.objectId) });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const result = await editCivicObjectMetadata(parseCivicObjectType(params.objectType), params.objectId, await readCivicObjectBody(request));
    return NextResponse.json({ result });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}
