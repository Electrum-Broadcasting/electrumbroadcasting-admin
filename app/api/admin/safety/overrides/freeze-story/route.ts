import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Freeze is no longer supported" }, { status: 410 });
}
