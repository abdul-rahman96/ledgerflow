import { NextResponse } from "next/server";
import { privateJsonHeaders, routeError } from "@/lib/http";
import { upstreamJson } from "@/lib/operator-api";
import { requireSameOrigin, validateCsvFile, validateIdempotencyKey } from "@/lib/security";
import type { ImportBatch } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const incoming = await request.formData();
    const file = validateCsvFile(incoming.get("file"));
    const idempotencyKey = validateIdempotencyKey(incoming.get("idempotency_key"));
    const outgoing = new FormData();
    outgoing.set("file", file, file.name);
    outgoing.set("idempotency_key", idempotencyKey);
    const result = await upstreamJson<ImportBatch>(
      "/api/v1/imports",
      { method: "POST", body: outgoing },
      true,
    );
    return NextResponse.json(result, { headers: privateJsonHeaders });
  } catch (error) {
    return routeError(error);
  }
}
