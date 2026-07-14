import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/admin/password";

export async function GET() {
  const hash = "$2b$12$t45kQ0zAzKnrpYoeJs2zwOkwtfbUl.BwR0UvAM1CvnKk.qwNy1.AO";
  const password = "L4KEshore99$";

  const valid = await verifyPassword(password, hash);

  return NextResponse.json({ valid });
}
