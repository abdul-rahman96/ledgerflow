import { NextResponse } from "next/server";
import { privateJsonHeaders, routeError } from "@/lib/http";
import { upstreamJson } from "@/lib/operator-api";
import { requireSameOrigin, RequestValidationError } from "@/lib/security";
import type { ImportBatch } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    requireSameOrigin(request);
    const { batchId } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(batchId)) {
      throw new RequestValidationError("invalid batch identifier", 422);
    }
    const result = await upstreamJson<ImportBatch>(
      `/api/v1/imports/${encodeURIComponent(batchId)}/rollback`,
      { method: "POST" },
      true,
    );
    return NextResponse.json(result, { headers: privateJsonHeaders });
  } catch (error) {
    return routeError(error);
  }
}
