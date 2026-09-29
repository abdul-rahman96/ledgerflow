import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  RequestValidationError,
  requireSameOrigin,
  validateCsvFile,
  validateIdempotencyKey,
} from "./security";

function request(origin?: string, host = "operator.example.com") {
  const headers = new Headers({ host, "x-forwarded-proto": "https" });
  if (origin) headers.set("origin", origin);
  return new Request("https://operator.example.com/api/preview", { headers });
}

describe("operator request security", () => {
  it("accepts an exact same-origin request", () => {
    expect(() => requireSameOrigin(request("https://operator.example.com"))).not.toThrow();
  });

  it("rejects missing and cross-origin requests", () => {
    expect(() => requireSameOrigin(request())).toThrow(RequestValidationError);
    expect(() => requireSameOrigin(request("https://attacker.example"))).toThrow("same-origin request required");
  });

  it("validates a non-empty CSV within the byte limit", () => {
    const file = new File(["external_id,amount\nrow-1,10"], "batch.csv", { type: "text/csv" });
    expect(validateCsvFile(file)).toBe(file);
  });

  it("rejects misleading extensions, empty files, and oversized files", () => {
    expect(() => validateCsvFile(new File(["x"], "batch.txt", { type: "text/csv" }))).toThrow("upload must be a CSV file");
    expect(() => validateCsvFile(new File([], "batch.csv", { type: "text/csv" }))).toThrow("CSV file is empty");
    expect(() => validateCsvFile(new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "batch.csv", { type: "text/csv" }))).toThrow("1 MiB limit");
  });

  it("normalizes and bounds idempotency keys", () => {
    expect(validateIdempotencyKey("  import-2026-09  ")).toBe("import-2026-09");
    expect(() => validateIdempotencyKey(" ")).toThrow("1 to 128 characters");
    expect(() => validateIdempotencyKey("x".repeat(129))).toThrow("1 to 128 characters");
  });
});
