import { NextResponse } from "next/server";
import { getMomentRelationships, replaceMomentRelationships } from "@/lib/admin/momentRelationships";
import { civicObjectErrorResponse, readCivicObjectBody } from "../../../response";

type Params = { params: { objectType: string; objectId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    if (params.objectType !== "moment") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(await getMomentRelationships(params.objectId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    if (params.objectType !== "moment") return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await replaceMomentRelationships(params.objectId, await readCivicObjectBody(request));
    return NextResponse.json({ result });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}
