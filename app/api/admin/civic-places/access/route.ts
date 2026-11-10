import { NextResponse } from "next/server";
import {
  CivicPlaceMutationError,
  getCivicPlaceCityActions,
} from "@/lib/admin/civicPlaceMutations";

export async function GET(request: Request) {
  const citySlug = new URL(request.url).searchParams.get("citySlug");
  try {
    const actions = await getCivicPlaceCityActions(citySlug);
    return NextResponse.json({ actions });
  } catch (error) {
    if (error instanceof CivicPlaceMutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected civic Place city authorization error:", error);
    return NextResponse.json({ error: "Unable to authorize Place actions" }, { status: 500 });
  }
}
