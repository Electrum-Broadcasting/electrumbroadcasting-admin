"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLE_COLUMN, ADMIN_ROLE_TABLE, ADMIN_USER_ID_COLUMN, normalizeAdminRole } from "@/lib/admin/role";

function encodeMessage(type: "error" | "success", message: string) {
  return `${type}=${encodeURIComponent(message)}`;
}

// Resolve the site origin in this order: configured env URL, Origin header,
// forwarded/host headers, then localhost as a final development fallback.
function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured;
  }

  const headerStore = headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?${encodeMessage("error", error.message)}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?${encodeMessage("error", "Unable to load user session after login.")}`);
  }

  const { data: roleData, error: roleError } = await supabase
    .from(ADMIN_ROLE_TABLE)
    .select(ADMIN_ROLE_COLUMN)
    .eq(ADMIN_USER_ID_COLUMN, user.id)
    .maybeSingle();

  let role = null;
  if (!roleError) {
    role = normalizeAdminRole(roleData?.[ADMIN_ROLE_COLUMN]);
  }

  if (role === "admin") {
    redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
  }

  redirect("/");
}

export async function createAccountAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/login`
    }
  });

  if (error) {
    redirect(`/create-account?${encodeMessage("error", error.message)}`);
  }

  redirect(`/login?${encodeMessage("success", "Account created. Check your email to verify your account.")}`);
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/update-password`
  });

  if (error) {
    redirect(`/reset-password?${encodeMessage("error", error.message)}`);
  }

  redirect(`/reset-password?${encodeMessage("success", "Password reset link sent.")}`);
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/update-password?${encodeMessage("error", error.message)}`);
  }

  redirect(`/login?${encodeMessage("success", "Password updated. Please sign in.")}`);
}

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
