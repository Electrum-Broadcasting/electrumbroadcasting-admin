"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function encodeMessage(type: "error" | "success", message: string) {
  return `${type}=${encodeURIComponent(message)}`;
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

  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function createAccountAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
      }/login`,
    },
  });

  if (error) {
    redirect(`/create-account?${encodeMessage("error", error.message)}`);
  }

  redirect(
    `/login?${encodeMessage(
      "success",
      "Account created. Check your email to verify your account."
    )}`
  );
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    }/update-password`,
  });

  if (error) {
    redirect(`/reset-password?${encodeMessage("error", error.message)}`);
  }

  redirect(
    `/reset-password?${encodeMessage(
      "success",
      "Password reset link sent."
    )}`
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

    if (error) {
    redirect(`/update-password?${encodeMessage("error", error.message)}`);
  }

  redirect(
    `/login?${encodeMessage(
      "success",
      "Password updated. Please sign in."
    )}`
  );
}

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
