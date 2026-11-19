import { NextResponse } from "next/server";
import { listHotspots, mutateHotspot, searchHotspotTargets } from "@/lib/admin/hotspots";
import { civicObjectErrorResponse, readCivicObjectBody } from "../../../../../response";

type Params = { params: { objectType: string; objectId: string; panoramaId: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.has("targetType")) {
      const targets = await searchHotspotTargets(params.objectType, params.objectId, params.panoramaId,
        url.searchParams.get("targetType") ?? "", url.searchParams.get("search") ?? "");
      return NextResponse.json({ targets }, { headers: { "Cache-Control": "no-store" } });
    }
    const hotspots = await listHotspots(params.objectType, params.objectId, params.panoramaId);
    return NextResponse.json({ hotspots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const body = await readCivicObjectBody(request);
    const result = await mutateHotspot(params.objectType, params.objectId, params.panoramaId, body);
    return NextResponse.json({ result });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}
