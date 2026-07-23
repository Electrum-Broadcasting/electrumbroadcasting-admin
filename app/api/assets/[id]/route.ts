import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ASSETS_BUCKET = process.env.SUPABASE_ASSETS_BUCKET ?? "assets";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const assetId = params.id;
    if (!assetId) {
      return NextResponse.json({ error: "Missing asset id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("id, metadata")
      .eq("id", assetId)
      .maybeSingle();

    if (assetError) {
      console.error("Error loading asset record:", assetError);
      return NextResponse.json({ error: assetError.message }, { status: 500 });
    }

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const metadata = (asset.metadata ?? {}) as Record<string, unknown>;
    const bucket = typeof metadata.bucket === "string" ? metadata.bucket : DEFAULT_ASSETS_BUCKET;
    const path = typeof metadata.path === "string" ? metadata.path : "";
    const contentType =
      typeof metadata.content_type === "string" ? metadata.content_type : "application/octet-stream";

    if (!path) {
      return NextResponse.json({ error: "Asset path not found" }, { status: 404 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (downloadError || !fileData) {
      console.error("Error downloading storage asset:", downloadError);
      return NextResponse.json({ error: "Asset file not found" }, { status: 404 });
    }

    const bytes = await fileData.arrayBuffer();

    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
      status: 200,
    });
  } catch (error) {
    console.error("GET /api/assets/[id] error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
