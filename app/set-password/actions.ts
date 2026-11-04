"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REQUIREMENTS =
  "Password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number and a symbol.";

function meetsPasswordPolicy(password: string) {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export async function setPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const supabase = createSupabaseServerClient();

  // Identity comes only from the caller's own cookie-backed session.
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data?.user) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Your invitation session has expired. Please use your invitation link again.")
    );
  }

  const fail = (message: string) =>
    redirect(`/set-password?error=${encodeURIComponent(message)}`);

  if (!meetsPasswordPolicy(password)) {
    fail(PASSWORD_REQUIREMENTS);
  }
  if (password !== confirm) {
    fail("Passwords do not match.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    fail(error.message || "Unable to set password.");
  }

  await supabase.auth.signOut();
  redirect("/login?success=" + encodeURIComponent("Password set. Please sign in."));
}
