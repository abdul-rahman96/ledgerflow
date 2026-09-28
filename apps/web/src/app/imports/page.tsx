import { CheckCircle2, Database, FileSpreadsheet, KeyRound, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ledgerflow/page-header";
import { StatusBadge } from "@/components/ledgerflow/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { previewRows } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default function ImportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Controlled ingestion" title="Import & validate" description="Preview a CSV, isolate invalid rows, and commit one idempotent batch without exposing a third-party credential." />
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-white/8 bg-card/80">
          <CardHeader><CardTitle>New CSV batch</CardTitle><CardDescription>Required columns: external_id, occurred_at, description, amount, currency, account.</CardDescription></CardHeader>
          <CardContent>
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-300/25 bg-cyan-300/[0.035] px-6 text-center transition-colors hover:bg-cyan-300/[0.06]">
              <UploadCloud className="mb-4 size-8 text-cyan-300" aria-hidden="true" />
              <span className="text-sm font-medium">Choose a CSV file</span>
              <span className="mt-1 text-xs text-muted-foreground">Synthetic fixtures only · up to 10 MB</span>
              <Input type="file" accept=".csv,text/csv" className="sr-only" />
            </label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input aria-label="Idempotency key" defaultValue="september-settlements-2026-09" className="border-white/8 bg-black/10 font-mono text-xs" />
              <Button className="shrink-0 bg-cyan-300 text-slate-950 hover:bg-cyan-200">Validate fixture</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-card/80">
          <CardHeader><CardTitle>Connector policy</CardTitle><CardDescription>Deliberately keyless for this public build.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-4"><span className="flex items-center gap-3 text-sm"><FileSpreadsheet className="size-4 text-emerald-300" />CSV upload</span><Badge className="bg-emerald-300/10 text-emerald-200">Enabled</Badge></div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-4"><span className="flex items-center gap-3 text-sm"><Database className="size-4 text-emerald-300" />Fixture seed</span><Badge className="bg-emerald-300/10 text-emerald-200">Enabled</Badge></div>
            <div className="flex items-center justify-between rounded-xl border border-white/7 bg-black/10 p-4"><span className="flex items-center gap-3 text-sm text-muted-foreground"><KeyRound className="size-4" />External APIs</span><Badge variant="outline">No keys</Badge></div>
            <p className="text-xs leading-5 text-muted-foreground">Expired legacy values are not copied, tested, or trusted. Future connectors must use fresh scoped secrets outside source control.</p>
          </CardContent>
        </Card>
      </section>

      <Alert className="border-cyan-300/15 bg-cyan-300/5">
        <ShieldCheck className="size-4 text-cyan-300" />
        <AlertTitle>Preview is safe to inspect</AlertTitle>
        <AlertDescription>2 rows are ready, 1 duplicate is ignored, and 1 malformed row is quarantined. Nothing is committed yet.</AlertDescription>
      </Alert>

      <Card className="border-white/8 bg-card/80">
        <CardHeader className="flex-row items-center justify-between gap-4"><div><CardTitle>Validation preview</CardTitle><CardDescription>Representative output from the local fixture connector.</CardDescription></div><Button className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">Commit 2 rows</Button></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Row</TableHead><TableHead>External ID</TableHead><TableHead>Timestamp</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
            <TableBody>{previewRows.map((row) => (
              <TableRow key={row.row}>
                <TableCell className="font-mono">{row.row}</TableCell><TableCell className="font-mono text-xs">{row.externalId}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{row.occurredAt}</TableCell><TableCell>{row.description}</TableCell><TableCell className="text-right font-mono">{formatCurrency(row.amount)}</TableCell>
                <TableCell><span className="flex items-center gap-2">{row.result === "Valid" ? <CheckCircle2 className="size-4 text-emerald-300" /> : <XCircle className="size-4 text-amber-300" />}<StatusBadge status={row.result} /></span></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
