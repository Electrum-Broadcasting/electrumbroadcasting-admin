import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, "", options);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.user_metadata.role !== "CEO" && user.user_metadata.role !== "CITY_ADMIN") {
    redirect("/login?error=Unauthorized");
  }

  return <>{children}</>;
}
