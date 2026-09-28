export const cashFlow = [
  { month: "Apr", inflow: 64_000, outflow: 31_000 },
  { month: "May", inflow: 72_000, outflow: 39_000 },
  { month: "Jun", inflow: 69_500, outflow: 35_500 },
  { month: "Jul", inflow: 83_000, outflow: 42_000 },
  { month: "Aug", inflow: 78_500, outflow: 38_800 },
  { month: "Sep", inflow: 96_480, outflow: 41_209 },
] as const;

export const ledgerEntries = [
  { id: "txn_8F2A", occurredAt: "Sep 28, 2026", description: "Northstar subscription settlement", account: "Revenue · SaaS", source: "CSV", amount: 18_400, status: "Matched" },
  { id: "txn_8F29", occurredAt: "Sep 27, 2026", description: "Cloud infrastructure", account: "Operations · Cloud", source: "CSV", amount: -4_720.18, status: "Matched" },
  { id: "txn_8F28", occurredAt: "Sep 27, 2026", description: "International wire receipt", account: "Revenue · Services", source: "Fixture", amount: 26_750, status: "Review" },
  { id: "txn_8F27", occurredAt: "Sep 26, 2026", description: "Payroll disbursement", account: "Operations · Payroll", source: "CSV", amount: -18_960, status: "Matched" },
  { id: "txn_8F26", occurredAt: "Sep 25, 2026", description: "Partner referral credit", account: "Revenue · Partners", source: "Fixture", amount: 3_200, status: "Matched" },
  { id: "txn_8F25", occurredAt: "Sep 24, 2026", description: "Software subscriptions", account: "Operations · Tools", source: "CSV", amount: -1_280.42, status: "Review" },
] as const;

export const importBatches = [
  { id: "imp_2C91", fileName: "september-settlements.csv", entries: 248, rejected: 2, createdAt: "Today, 09:42", status: "Committed" },
  { id: "imp_2C90", fileName: "partner-payouts.csv", entries: 86, rejected: 0, createdAt: "Sep 27, 16:18", status: "Committed" },
  { id: "imp_2C8F", fileName: "expense-export.csv", entries: 134, rejected: 4, createdAt: "Sep 25, 11:05", status: "Review" },
  { id: "imp_2C8E", fileName: "august-correction.csv", entries: 12, rejected: 0, createdAt: "Sep 22, 14:30", status: "Rolled back" },
] as const;

export const previewRows = [
  { row: 1, externalId: "SET-10491", occurredAt: "2026-09-28T08:31:00Z", description: "Card settlement", amount: 12_450, result: "Valid" },
  { row: 2, externalId: "SET-10492", occurredAt: "2026-09-28T08:34:00Z", description: "Usage settlement", amount: 5_950, result: "Valid" },
  { row: 3, externalId: "SET-10492", occurredAt: "2026-09-28T08:34:00Z", description: "Duplicate settlement", amount: 5_950, result: "Duplicate" },
  { row: 4, externalId: "SET-10494", occurredAt: "invalid", description: "Malformed timestamp", amount: 830, result: "Rejected" },
] as const;

export const reconciliationItems = [
  { id: "rec_491", reference: "SET-10488", account: "Revenue · SaaS", ledgerAmount: 18_400, sourceAmount: 18_250, variance: 150, status: "Review" },
  { id: "rec_490", reference: "WIRE-7721", account: "Revenue · Services", ledgerAmount: 26_750, sourceAmount: 26_775, variance: -25, status: "Review" },
  { id: "rec_48F", reference: "EXP-99214", account: "Operations · Tools", ledgerAmount: -1_280.42, sourceAmount: -1_250, variance: -30.42, status: "Investigating" },
  { id: "rec_48E", reference: "PAY-1827", account: "Operations · Payroll", ledgerAmount: -18_960, sourceAmount: -18_960, variance: 0, status: "Matched" },
] as const;

export const auditEvents = [
  { id: "evt_A921", time: "09:43:18", date: "Today", actor: "System", action: "Import committed", detail: "248 ledger entries created from september-settlements.csv", entity: "imp_2C91", tone: "success" },
  { id: "evt_A920", time: "09:42:51", date: "Today", actor: "Abdul", action: "Import approved", detail: "Accepted 248 valid rows and excluded 2 rejected rows", entity: "imp_2C91", tone: "info" },
  { id: "evt_A91F", time: "09:42:19", date: "Today", actor: "System", action: "Validation completed", detail: "Idempotency, amount precision, and timestamp checks passed", entity: "imp_2C91", tone: "info" },
  { id: "evt_A91E", time: "14:34:02", date: "Sep 22", actor: "Abdul", action: "Batch rolled back", detail: "12 entries reversed; original audit evidence retained", entity: "imp_2C8E", tone: "warning" },
] as const;
