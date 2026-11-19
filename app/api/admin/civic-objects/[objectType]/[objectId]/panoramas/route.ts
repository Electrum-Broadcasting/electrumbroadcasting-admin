import { NextResponse } from "next/server";
import { checkPanoramaAccess, createPanorama, listPanoramas, mutatePanorama } from "@/lib/admin/panoramas";
import { CivicObjectMutationError } from "@/lib/admin/civicObjectMutations";
import { civicObjectErrorResponse, readCivicObjectBody } from "../../../response";

type Params = { params: { objectType: string; objectId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    return NextResponse.json({ panoramas: await listPanoramas(params.objectType, params.objectId) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await checkPanoramaAccess(params.objectType, params.objectId);
    const limit = 51 * 1024 * 1024;
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > limit) {
      throw new CivicObjectMutationError("Image must be no larger than 50 MiB.", 413, "too_large");
    }
    const contentType = request.headers.get("content-type");
    if (!contentType?.toLowerCase().startsWith("multipart/form-data;") || !request.body) {
      throw new CivicObjectMutationError("A multipart image upload is required.", 400, "invalid_input");
    }
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new CivicObjectMutationError("Image must be no larger than 50 MiB.", 413, "too_large");
      }
      chunks.push(value);
    }
    let form: FormData;
    try {
      form = await new Response(new Uint8Array(Buffer.concat(chunks)), { headers: { "Content-Type": contentType } }).formData();
    } catch (error) {
      console.error("Invalid panorama upload:", error);
      throw new CivicObjectMutationError("Invalid multipart image upload.", 400, "invalid_input");
    }
    return NextResponse.json({ result: await createPanorama(params.objectType, params.objectId, form) });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    return NextResponse.json({ result: await mutatePanorama(params.objectType, params.objectId, await readCivicObjectBody(request)) });
  } catch (error) {
    return civicObjectErrorResponse(error);
  }
}
