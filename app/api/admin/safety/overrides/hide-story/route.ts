import { NextResponse } from "next/server";
import { getAdminContextOrNull } from "@/lib/admin/context";
import { moderateStory, ModerationError } from "@/lib/admin/storyModeration";

export async function POST(request: Request) {
  const admin = await getAdminContextOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const result = await moderateStory(admin, (body as Record<string, unknown>).story_id, "hide", null, null);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof ModerationError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Unexpected story moderation error:", error);
    return NextResponse.json({ error: "Unable to confirm moderation result; refresh before retrying" }, { status: 500 });
  }
}
