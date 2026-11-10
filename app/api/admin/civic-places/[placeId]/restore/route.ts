import { NextResponse } from "next/server";
import {
  CivicPlaceMutationError,
  restoreCivicPlace,
} from "@/lib/admin/civicPlaceMutations";

export async function POST(
  _request: Request,
  { params }: { params: { placeId: string } },
) {
  try {
    const result = await restoreCivicPlace(params.placeId);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CivicPlaceMutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected civic Place restoration error:", error);
    return NextResponse.json({ error: "Place restoration failed" }, { status: 500 });
  }
}
