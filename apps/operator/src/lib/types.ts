export type AcceptedRow = {
  external_id: string;
  occurred_at: string;
  description: string;
  amount: string;
  currency: string;
  account: string;
};

export type RejectedRow = { row: number; reason: string };

export type PreviewResult = {
  file_name: string;
  accepted: AcceptedRow[];
  rejected: RejectedRow[];
};

export type ImportBatch = {
  id: string;
  file_name: string;
  idempotency_key: string;
  status: string;
  imported_count: number;
  rejected_count: number;
  created_at: string;
  rolled_back_at: string | null;
};

export type AuditEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  event_metadata: Record<string, unknown>;
  occurred_at: string;
};

export type OperatorState = {
  imports: ImportBatch[];
  auditEvents: AuditEvent[];
  available: boolean;
};
