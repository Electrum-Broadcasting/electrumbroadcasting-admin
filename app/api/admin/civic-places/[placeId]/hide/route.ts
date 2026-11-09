import { NextResponse } from "next/server";
import {
  CivicPlaceMutationError,
  hideCivicPlace,
} from "@/lib/admin/civicPlaceMutations";

export async function POST(
  _request: Request,
  { params }: { params: { placeId: string } },
) {
  try {
    const result = await hideCivicPlace(params.placeId);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CivicPlaceMutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected civic Place hide error:", error);
    return NextResponse.json({ error: "Place hide failed" }, { status: 500 });
  }
}
