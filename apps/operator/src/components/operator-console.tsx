"use client";

import {
  CheckCircle2,
  FileCheck2,
  FileUp,
  History,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { AuditEvent, ImportBatch, OperatorState, PreviewResult } from "@/lib/types";

type Notice = { tone: "success" | "error"; message: string } | null;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function eventSummary(event: AuditEvent): string {
  const metadata = event.event_metadata;
  if (event.action === "import_committed") {
    return `${String(metadata.imported ?? 0)} rows imported; ${String(metadata.rejected ?? 0)} rejected`;
  }
  if (event.action === "import_rolled_back") {
    return `${String(metadata.compensated_entries ?? 0)} entries compensated`;
  }
  if (event.action === "fixture_seeded") {
    return `${String(metadata.entry_count ?? 0)} synthetic entries seeded`;
  }
  return `${event.entity_type} ${event.entity_id}`;
}

async function readResult<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The operation could not be completed.");
  return body;
}

function StatusPill({ status }: { status: string }) {
  const rolledBack = status.toLowerCase().includes("rolled");
  return <span className={rolledBack ? "pill pill-warning" : "pill pill-success"}>{titleCase(status)}</span>;
}

export function OperatorConsole({ state }: { state: OperatorState }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState(() => `portfolio-import-${new Date().toISOString().slice(0, 10)}`);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null);

  const acceptedAmount = useMemo(
    () => preview?.accepted.reduce((total, row) => total + Number(row.amount), 0) ?? 0,
    [preview],
  );

  function chooseFile(nextFile: File | null) {
    setFile(nextFile);
    setPreview(null);
    setNotice(null);
  }

  async function previewFile(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setNotice({ tone: "error", message: "Choose a CSV file before previewing." });
      return;
    }
    setBusy("preview");
    setNotice(null);
    const data = new FormData();
    data.set("file", file);
    try {
      const response = await fetch("/api/preview", { method: "POST", body: data });
      const result = await readResult<PreviewResult>(response);
      setPreview(result);
      setNotice({ tone: "success", message: `Validation finished: ${result.accepted.length} accepted, ${result.rejected.length} rejected.` });
    } catch (error) {
      setPreview(null);
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Preview failed." });
    } finally {
      setBusy(null);
    }
  }

  async function commitImport() {
    if (!file || !preview || preview.accepted.length === 0) return;
    setBusy("commit");
    setNotice(null);
    const data = new FormData();
    data.set("file", file);
    data.set("idempotency_key", key);
    try {
      const response = await fetch("/api/imports", { method: "POST", body: data });
      const batch = await readResult<ImportBatch>(response);
      setNotice({ tone: "success", message: `Batch ${batch.id} committed with ${batch.imported_count} imported rows.` });
      setPreview(null);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Import failed." });
    } finally {
      setBusy(null);
    }
  }

  async function rollback(batchId: string) {
    setBusy(batchId);
    setNotice(null);
    try {
      const response = await fetch(`/api/imports/${encodeURIComponent(batchId)}/rollback`, { method: "POST" });
      const batch = await readResult<ImportBatch>(response);
      setNotice({ tone: "success", message: `Batch ${batch.id} rolled back with a compensating audit event.` });
      setConfirmRollback(null);
      router.refresh();
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Rollback failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="LedgerFlow operator home">
          <span className="brand-mark">LF</span>
          <span>LedgerFlow <small>Operator</small></span>
        </a>
        <div className="protected"><LockKeyhole aria-hidden="true" /> Vercel-authenticated workspace</div>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">Controlled financial data operations</p>
          <h1>Validate first. Commit deliberately. Reverse safely.</h1>
          <p className="lede">A protected control plane for CSV ledger ingestion. Every mutation is server-authenticated, idempotent, and preserved in the audit trail.</p>
        </div>
        <div className="guardrail-card">
          <ShieldCheck aria-hidden="true" />
          <div><strong>Two security boundaries</strong><span>Vercel identity at the edge, scoped write access on the API.</span></div>
        </div>
      </section>

      {!state.available && (
        <div className="notice error" role="alert"><TriangleAlert aria-hidden="true" /> The live API is unavailable. Mutations remain fail-closed.</div>
      )}
      {notice && (
        <div className={`notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "success" ? <CheckCircle2 aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}{notice.message}
        </div>
      )}

      <section className="workspace-grid" aria-label="Import workspace">
        <form className="panel import-panel" onSubmit={previewFile}>
          <div className="panel-heading"><div><p className="step">Step 1</p><h2>Prepare an import</h2><p>CSV only, up to 1 MiB. The file is sent directly to the validation service.</p></div><FileUp aria-hidden="true" /></div>
          <label className="dropzone">
            <input ref={fileInput} type="file" accept=".csv,text/csv,application/csv,application/vnd.ms-excel" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
            <FileCheck2 aria-hidden="true" />
            <strong>{file ? file.name : "Choose a CSV file"}</strong>
            <span>{file ? `${(file.size / 1024).toFixed(1)} KiB selected` : "external_id, occurred_at, description, amount, currency, account"}</span>
          </label>
          <label className="field"><span>Idempotency key</span><input value={key} onChange={(event) => setKey(event.target.value)} maxLength={128} autoComplete="off" spellCheck={false} /></label>
          <button className="button primary" type="submit" disabled={!file || busy !== null}>
            {busy === "preview" ? <LoaderCircle className="spin" aria-hidden="true" /> : <FileCheck2 aria-hidden="true" />}Preview & validate
          </button>
        </form>

        <aside className="panel policy-panel">
          <div className="panel-heading"><div><p className="step">Guardrails</p><h2>Before you commit</h2></div><ShieldCheck aria-hidden="true" /></div>
          <ol className="policy-list">
            <li><span>1</span><div><strong>Validate</strong><p>Malformed and unsafe rows are isolated before writes.</p></div></li>
            <li><span>2</span><div><strong>Review</strong><p>Accepted and rejected totals are visible before commit.</p></div></li>
            <li><span>3</span><div><strong>Commit once</strong><p>The key makes retries return the same batch.</p></div></li>
            <li><span>4</span><div><strong>Compensate</strong><p>Rollback preserves evidence instead of deleting history.</p></div></li>
          </ol>
        </aside>
      </section>

      <section className="panel preview-panel" aria-labelledby="preview-title">
        <div className="panel-heading preview-heading"><div><p className="step">Step 2</p><h2 id="preview-title">Validation preview</h2><p>{preview ? `${preview.file_name} is ready for review.` : "Select a file and run validation to see exact results."}</p></div>{preview && <div className="preview-stats"><span><strong>{preview.accepted.length}</strong> accepted</span><span><strong>{preview.rejected.length}</strong> rejected</span><span><strong>{acceptedAmount.toFixed(2)}</strong> net</span></div>}</div>
        {preview ? (
          <>
            <div className="table-wrap"><table><thead><tr><th>External ID</th><th>Occurred</th><th>Description</th><th>Account</th><th>Amount</th><th>Result</th></tr></thead><tbody>
              {preview.accepted.map((row, index) => <tr key={`${row.external_id}-${index}`}><td className="mono">{row.external_id}</td><td>{formatDate(row.occurred_at)}</td><td>{row.description}</td><td>{row.account}</td><td className="mono amount">{row.currency} {Number(row.amount).toFixed(2)}</td><td><span className="pill pill-success">Accepted</span></td></tr>)}
              {preview.rejected.map((row) => <tr key={`rejected-${row.row}`}><td className="mono">Row {row.row}</td><td colSpan={4}>{row.reason}</td><td><span className="pill pill-warning">Rejected</span></td></tr>)}
            </tbody></table></div>
            <div className="commit-bar"><div><strong>Commit accepted rows?</strong><span>Rejected rows will not be written. This action is auditable and reversible.</span></div><button className="button primary" type="button" disabled={!key.trim() || preview.accepted.length === 0 || busy !== null} onClick={commitImport}>{busy === "commit" ? <LoaderCircle className="spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}Commit batch</button></div>
          </>
        ) : <div className="empty"><FileCheck2 aria-hidden="true" /><strong>No validation run yet</strong><span>Nothing is written during preview.</span></div>}
      </section>

      <section className="lower-grid">
        <div className="panel">
          <div className="panel-heading"><div><p className="step">Recovery</p><h2>Recent batches</h2><p>Rollback creates compensating state and retains the original record.</p></div><RotateCcw aria-hidden="true" /></div>
          <div className="batch-list">{state.imports.length ? state.imports.slice(0, 6).map((batch) => (
            <article className="batch" key={batch.id}><div><div className="batch-title"><strong>{batch.file_name}</strong><StatusPill status={batch.status} /></div><p>{formatDate(batch.created_at)} UTC · {batch.imported_count} imported · {batch.rejected_count} rejected</p><code>{batch.id}</code></div>
              {batch.status.toLowerCase() === "committed" && (confirmRollback === batch.id ? <div className="confirm"><span>Confirm rollback?</span><button className="button danger" type="button" disabled={busy !== null} onClick={() => rollback(batch.id)}>{busy === batch.id && <LoaderCircle className="spin" aria-hidden="true" />}Yes, compensate</button><button className="button ghost" type="button" onClick={() => setConfirmRollback(null)}>Cancel</button></div> : <button className="button secondary" type="button" disabled={busy !== null} onClick={() => setConfirmRollback(batch.id)}><RotateCcw aria-hidden="true" />Rollback</button>)}
            </article>
          )) : <div className="empty compact"><History aria-hidden="true" /><span>No import batches returned.</span></div>}</div>
        </div>

        <div className="panel">
          <div className="panel-heading"><div><p className="step">Evidence</p><h2>Audit trail</h2><p>Append-only events from the live API.</p></div><History aria-hidden="true" /></div>
          <ol className="timeline">{state.auditEvents.length ? state.auditEvents.slice(0, 8).map((event) => <li key={event.id}><span className="timeline-dot" /><div><div><strong>{titleCase(event.action)}</strong><time>{formatDate(event.occurred_at)} UTC</time></div><p>{eventSummary(event)}</p><code>{event.actor}</code></div></li>) : <li className="empty compact"><span>No audit events returned.</span></li>}</ol>
        </div>
      </section>
      <footer><span>LedgerFlow Operator</span><span>Server-only credentials · same-origin mutations · no indexing</span></footer>
    </main>
  );
}
