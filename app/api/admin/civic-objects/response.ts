import { NextResponse } from "next/server";
import { CivicObjectMutationError } from "@/lib/admin/civicObjectMutations";

export async function readCivicObjectBody(request: Request, allowEmpty = false): Promise<unknown> {
  const text = await request.text();
  if (allowEmpty && !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new CivicObjectMutationError("Invalid JSON", 400, "invalid_input");
  }
}

export function civicObjectErrorResponse(error: unknown) {
  if (error instanceof CivicObjectMutationError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error("Unexpected civic object request error:", error);
  return NextResponse.json({ error: "Civic object request failed", code: "internal_error" }, { status: 500 });
}
