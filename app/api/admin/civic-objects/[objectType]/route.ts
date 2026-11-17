import { NextResponse } from "next/server";
import { createPendingCivicObject, parseCivicObjectRequest, parseCivicObjectType } from "@/lib/admin/civicObjectMutations";
import { civicObjectErrorResponse, readCivicObjectBody } from "../response";

export async function POST(request: Request, { params }: { params: { objectType: string } }) {
  try {
    const type = parseCivicObjectType(params.objectType);
    const { citySlug, data } = parseCivicObjectRequest(await readCivicObjectBody(request));
    return NextResponse.json({ result: await createPendingCivicObject(type, citySlug, data) });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}
