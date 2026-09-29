import { NextResponse } from "next/server";
import { privateJsonHeaders, routeError } from "@/lib/http";
import { upstreamJson } from "@/lib/operator-api";
import { requireSameOrigin, validateCsvFile } from "@/lib/security";
import type { PreviewResult } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const incoming = await request.formData();
    const file = validateCsvFile(incoming.get("file"));
    const outgoing = new FormData();
    outgoing.set("file", file, file.name);
    const result = await upstreamJson<PreviewResult>(
      "/api/v1/imports/preview",
      { method: "POST", body: outgoing },
      true,
    );
    return NextResponse.json(result, { headers: privateJsonHeaders });
  } catch (error) {
    return routeError(error);
  }
}
