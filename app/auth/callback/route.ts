import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Administrator invitation callback. Accepts only ?token_hash=…&type=invite.
// Credentials are never logged and the redirect always lands on a clean URL.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  const redirectTo = (pathname: string, error?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = error ? `?error=${encodeURIComponent(error)}` : "";
    url.hash = "";
    return NextResponse.redirect(url);
  };

  const invalid = () =>
    redirectTo("/login", "Invitation link is invalid or has expired");

  if (!tokenHash || type !== "invite") {
    return invalid();
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (error) {
    return invalid();
  }

  return redirectTo("/set-password");
}
