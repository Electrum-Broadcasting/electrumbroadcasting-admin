import { NextResponse } from "next/server";
import {
  CivicPlaceMutationError,
  editCivicPlaceMetadata,
} from "@/lib/admin/civicPlaceMutations";

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
