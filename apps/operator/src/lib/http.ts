import { NextResponse } from "next/server";
import { UpstreamError } from "@/lib/operator-api";
import { RequestValidationError } from "@/lib/security";

export const privateJsonHeaders = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export function routeError(error: unknown): NextResponse {
  if (error instanceof RequestValidationError || error instanceof UpstreamError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: privateJsonHeaders },
    );
  }
  return NextResponse.json(
    { error: "unexpected operator service error" },
    { status: 500, headers: privateJsonHeaders },
  );
}
