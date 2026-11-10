import { NextResponse } from "next/server";
import {
  approveCivicPlace,
  CivicPlaceMutationError,
} from "@/lib/admin/civicPlaceMutations";

export async function POST(
  _request: Request,
  { params }: { params: { placeId: string } },
) {
  try {
    const result = await approveCivicPlace(params.placeId);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CivicPlaceMutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected civic Place approval error:", error);
    return NextResponse.json({ error: "Place approval failed" }, { status: 500 });
  }
}
