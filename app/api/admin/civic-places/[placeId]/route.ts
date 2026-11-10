import { NextResponse } from "next/server";
import {
  CivicPlaceMutationError,
  editCivicPlaceMetadata,
  getCivicPlaceActions,
} from "@/lib/admin/civicPlaceMutations";

export async function GET(
  _request: Request,
  { params }: { params: { placeId: string } },
) {
  try {
    const actions = await getCivicPlaceActions(params.placeId);
    return NextResponse.json({ actions });
  } catch (error) {
    if (error instanceof CivicPlaceMutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected civic Place authorization error:", error);
    return NextResponse.json({ error: "Unable to authorize Place actions" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { placeId: string } },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await editCivicPlaceMetadata(params.placeId, body);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CivicPlaceMutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected civic Place metadata edit error:", error);
    return NextResponse.json({ error: "Place update failed" }, { status: 500 });
  }
}
