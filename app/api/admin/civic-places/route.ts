import { NextResponse } from "next/server";
import {
  CivicPlaceMutationError,
  createPendingCivicPlace,
  parseCivicPlaceRequest,
} from "@/lib/admin/civicPlaceMutations";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { citySlug, data } = parseCivicPlaceRequest(body);
    const result = await createPendingCivicPlace(citySlug, data);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CivicPlaceMutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected civic Place creation error:", error);
    return NextResponse.json({ error: "Place creation failed" }, { status: 500 });
  }
}
