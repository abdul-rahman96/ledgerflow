import "server-only";
import type { AuditEvent, ImportBatch, OperatorState } from "@/lib/types";

type JsonValue = Record<string, unknown> | unknown[];

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function apiUrl(): string {
  const configured = process.env.LEDGERFLOW_API_URL?.trim().replace(/\/$/, "");
  if (!configured) throw new UpstreamError("operator service is not configured", 503);
  return configured;
}

function writeKey(): string {
  const configured = process.env.WRITE_API_KEY?.trim();
  if (!configured) throw new UpstreamError("write operations are not configured", 503);
  return configured;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string" && body.detail.length <= 240) return body.detail;
  } catch {
    // The upstream may return an empty or non-JSON error response.
  }
  return response.status >= 500 ? "upstream service is unavailable" : "request was rejected";
}

export async function upstreamJson<T extends JsonValue>(
  path: string,
  init: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (authenticated) headers.set("X-LedgerFlow-Write-Key", writeKey());

  let response: Response;
  try {
    response = await fetch(`${apiUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new UpstreamError("upstream service is unavailable", 502);
  }
  if (!response.ok) throw new UpstreamError(await errorMessage(response), response.status);
  return (await response.json()) as T;
}

export async function getOperatorState(): Promise<OperatorState> {
  try {
    const [imports, auditEvents] = await Promise.all([
      upstreamJson<ImportBatch[]>("/api/v1/imports"),
      upstreamJson<AuditEvent[]>("/api/v1/audit-events"),
    ]);
    return { imports, auditEvents, available: true };
  } catch {
    return { imports: [], auditEvents: [], available: false };
  }
}
