import { NextResponse } from "next/server";
import { CivicEntityMutationError } from "@/lib/admin/civicEntityMutations";

export async function readEntityBody(request: Request, allowEmpty = false): Promise<unknown> {
  const text = await request.text();
  if (allowEmpty && !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new CivicEntityMutationError("Invalid JSON", 400, "invalid_input");
  }
}

export function entityErrorResponse(error: unknown) {
  if (error instanceof CivicEntityMutationError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error("Unexpected civic Entity request error:", error);
  return NextResponse.json({ error: "Entity request failed", code: "internal_error" }, { status: 500 });
}
