import { connection } from "next/server";
import {
  auditEvents as fixtureAuditEvents,
  importBatches as fixtureImportBatches,
  ledgerEntries as fixtureLedgerEntries,
  reconciliationItems as fixtureReconciliationItems,
} from "@/lib/data";

export type DataSource = "live" | "fixture";

type ApiDashboard = {
  currency: string;
  inflow: string;
  outflow: string;
  net: string;
  entries_needing_review: number;
};

type ApiLedgerEntry = {
  id: string;
  external_id: string;
  occurred_at: string;
  description: string;
  amount: string;
  currency: string;
  account: string;
  source: string;
  status: string;
};

type ApiImportBatch = {
  id: string;
  file_name: string;
  status: string;
  imported_count: number;
  rejected_count: number;
  created_at: string;
};

type ApiReconciliation = {
  id: string;
  external_id: string;
  account: string;
  ledger_amount: string;
  source_amount: string;
  variance: string;
  status: string;
};

type ApiAuditEvent = {
  id: string;
  action: string;
  entity_id: string;
  actor: string;
  event_metadata: Record<string, unknown>;
  occurred_at: string;
};

export type LedgerEntryView = {
  id: string;
  occurredAt: string;
  description: string;
  account: string;
  source: string;
  amount: number;
  status: string;
};

export type ImportBatchView = {
  id: string;
  fileName: string;
  entries: number;
  rejected: number;
  createdAt: string;
  status: string;
};

export type ReconciliationView = {
  id: string;
  reference: string;
  account: string;
  ledgerAmount: number;
  sourceAmount: number;
  variance: number;
  status: string;
};

export type AuditEventView = {
  id: string;
  time: string;
  date: string;
  actor: string;
  action: string;
  detail: string;
  entity: string;
  tone: "success" | "info" | "warning";
};

function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function timeLabel(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value));
}

async function fetchApi<T>(path: string): Promise<T | null> {
  const baseUrl = process.env.LEDGERFLOW_API_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;

  try {
    await connection();
    const response = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getDashboard() {
  const data = await fetchApi<ApiDashboard>("/api/v1/dashboard");
  if (!data) {
    return {
      source: "fixture" as const,
      inflow: 96_480,
      outflow: 41_209.16,
      net: 55_270.84,
      reviewCount: 7,
    };
  }
  return {
    source: "live" as const,
    inflow: Number(data.inflow),
    outflow: Number(data.outflow),
    net: Number(data.net),
    reviewCount: data.entries_needing_review,
  };
}

export async function getLedgerEntries(): Promise<{
  source: DataSource;
  data: readonly LedgerEntryView[];
}> {
  const data = await fetchApi<ApiLedgerEntry[]>("/api/v1/entries");
  if (!data) return { source: "fixture", data: fixtureLedgerEntries };
  return {
    source: "live",
    data: data.map((entry) => ({
      id: entry.id,
      occurredAt: dateLabel(entry.occurred_at),
      description: entry.description,
      account: entry.account,
      source: titleCase(entry.source),
      amount: Number(entry.amount),
      status: titleCase(entry.status),
    })),
  };
}

export async function getImportBatches(): Promise<{
  source: DataSource;
  data: readonly ImportBatchView[];
}> {
  const data = await fetchApi<ApiImportBatch[]>("/api/v1/imports");
  if (!data) return { source: "fixture", data: fixtureImportBatches };
  return {
    source: "live",
    data: data.map((batch) => ({
      id: batch.id,
      fileName: batch.file_name,
      entries: batch.imported_count,
      rejected: batch.rejected_count,
      createdAt: `${dateLabel(batch.created_at)}, ${timeLabel(batch.created_at).slice(0, 5)}`,
      status: titleCase(batch.status),
    })),
  };
}

export async function getReconciliations(): Promise<{
  source: DataSource;
  data: readonly ReconciliationView[];
}> {
  const data = await fetchApi<ApiReconciliation[]>("/api/v1/reconciliations");
  if (!data) return { source: "fixture", data: fixtureReconciliationItems };
  return {
    source: "live",
    data: data.map((item) => ({
      id: item.id,
      reference: item.external_id,
      account: item.account,
      ledgerAmount: Number(item.ledger_amount),
      sourceAmount: Number(item.source_amount),
      variance: Number(item.variance),
      status: titleCase(item.status),
    })),
  };
}

function eventDetail(event: ApiAuditEvent): string {
  const metadata = event.event_metadata;
  if (event.action === "fixture_seeded") {
    return `${String(metadata.entry_count ?? 0)} synthetic ledger entries created`;
  }
  if (event.action === "import_committed") {
    return `${String(metadata.imported ?? 0)} rows imported from ${String(metadata.file_name ?? "CSV")}; ${String(metadata.rejected ?? 0)} rejected`;
  }
  if (event.action === "import_rolled_back") {
    return `${String(metadata.compensated_entries ?? 0)} ledger entries moved to rolled-back state`;
  }
  return "Recorded by the append-only audit service";
}

export async function getAuditEvents(): Promise<{
  source: DataSource;
  data: readonly AuditEventView[];
}> {
  const data = await fetchApi<ApiAuditEvent[]>("/api/v1/audit-events");
  if (!data) return { source: "fixture", data: fixtureAuditEvents };
  return {
    source: "live",
    data: data.map((event) => ({
      id: event.id,
      time: timeLabel(event.occurred_at),
      date: dateLabel(event.occurred_at),
      actor: titleCase(event.actor),
      action: titleCase(event.action),
      detail: eventDetail(event),
      entity: event.entity_id,
      tone: event.action.includes("rollback") ? "warning" : event.action.includes("commit") ? "success" : "info",
    })),
  };
}
