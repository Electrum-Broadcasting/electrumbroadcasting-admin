import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ASSETS_BUCKET = process.env.SUPABASE_ASSETS_BUCKET ?? "assets";

function getFileExtension(name: string) {
	const dotIndex = name.lastIndexOf(".");
	return dotIndex > -1 ? name.slice(dotIndex).toLowerCase() : "";
}

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const upload = formData.get("file");

		if (!(upload instanceof File)) {
			return NextResponse.json({ error: "Missing file" }, { status: 400 });
		}

		if (!upload.type.startsWith("image/")) {
			return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
		}

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const assetId = crypto.randomUUID();
		const extension = getFileExtension(upload.name);
		const storagePath = `brand-logos/${assetId}${extension}`;

		const { error: uploadError } = await supabase.storage
			.from(ASSETS_BUCKET)
			.upload(storagePath, upload, {
				cacheControl: "3600",
				upsert: false,
				contentType: upload.type,
			});

		if (uploadError) {
			console.error("Error uploading asset to storage:", uploadError);
			return NextResponse.json({ error: uploadError.message }, { status: 500 });
		}

		const { error: insertError } = await supabase.from("media_assets").insert({
			id: assetId,
			url: `/api/assets/${assetId}`,
			alt_text: upload.name,
			type: "logo",
			metadata: {
				bucket: ASSETS_BUCKET,
				path: storagePath,
				content_type: upload.type,
				original_name: upload.name,
				size: upload.size,
			},
		});

		if (insertError) {
			await supabase.storage.from(ASSETS_BUCKET).remove([storagePath]);
			console.error("Error inserting media_assets record:", insertError);
			return NextResponse.json({ error: insertError.message }, { status: 500 });
		}

		return NextResponse.json({ asset_id: assetId });
	} catch (error) {
		console.error("POST /api/admin/assets/upload error:", error);
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
	}
}
