export const MAX_UPLOAD_BYTES = 1_048_576;
const CSV_CONTENT_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
]);

export class RequestValidationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function requireSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1);

  if (!origin || !host) {
    throw new RequestValidationError("same-origin request required", 403);
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new RequestValidationError("same-origin request required", 403);
  }

  if (originUrl.host !== host || originUrl.protocol !== `${protocol}:`) {
    throw new RequestValidationError("same-origin request required", 403);
  }
}

export function validateCsvFile(value: FormDataEntryValue | null): File {
  if (!(value instanceof File)) {
    throw new RequestValidationError("select a CSV file", 422);
  }
  const filename = value.name.toLowerCase();
  const contentType = value.type.toLowerCase();
  if (!filename.endsWith(".csv") || !CSV_CONTENT_TYPES.has(contentType)) {
    throw new RequestValidationError("upload must be a CSV file", 415);
  }
  if (value.size === 0) {
    throw new RequestValidationError("CSV file is empty", 422);
  }
  if (value.size > MAX_UPLOAD_BYTES) {
    throw new RequestValidationError("CSV exceeds the 1 MiB limit", 413);
  }
  return value;
}

export function validateIdempotencyKey(value: FormDataEntryValue | null): string {
  const key = typeof value === "string" ? value.trim() : "";
  if (!key || key.length > 128) {
    throw new RequestValidationError("idempotency key must be 1 to 128 characters", 422);
  }
  return key;
}
