import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const citySlug = formData.get("citySlug") as string;
    const slug = formData.get("slug") as string;

    if (!file || !citySlug || !slug) {
      return NextResponse.json({ error: "Missing required fields." });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filePath = `${citySlug}/${slug}/hero-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("story-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json({ error: uploadError.message });
    }

    const { data } = supabase.storage
      .from("story-images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message });
  }
}
