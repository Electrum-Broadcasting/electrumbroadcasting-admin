import { NextResponse } from "next/server";
import { createPendingCivicEntity, parseCivicEntityRequest } from "@/lib/admin/civicEntityMutations";
import { entityErrorResponse, readEntityBody } from "./response";

export async function POST(request: Request) {
  try {
    const { citySlug, data } = parseCivicEntityRequest(await readEntityBody(request));
    const result = await createPendingCivicEntity(citySlug, data);
    return NextResponse.json({ result });
  } catch (error) {
    return entityErrorResponse(error);
  }
}
