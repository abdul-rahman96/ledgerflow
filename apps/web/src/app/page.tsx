import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/ledgerflow/metric-card";
import { PageHeader } from "@/components/ledgerflow/page-header";
import { StatusBadge } from "@/components/ledgerflow/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cashFlow } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getDashboard, getImportBatches, getReconciliations } from "@/lib/live-data";

export default async function DashboardPage() {
  const [dashboard, batchesResult, reconciliationsResult] = await Promise.all([
    getDashboard(),
    getImportBatches(),
    getReconciliations(),
  ]);
  const importBatches = batchesResult.data;
  const reconciliationItems = reconciliationsResult.data;
  const maxFlow = Math.max(...cashFlow.map((point) => point.inflow));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations overview"
        title="Good morning, Abdul."
        description="Every imported cent is traceable, reconcilable, and reversible."
        actionHref="/imports"
        actionLabel="Import transactions"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Ledger metrics">
        <MetricCard label="Net balance" value={formatCurrency(dashboard.net)} change={dashboard.source === "live" ? "Live API" : "Fixture"} trend="up" icon={CircleDollarSign} />
        <MetricCard label="Total inflow" value={formatCurrency(dashboard.inflow)} change={dashboard.source === "live" ? "Live API" : "Fixture"} trend="up" icon={ArrowUpRight} />
        <MetricCard label="Total outflow" value={formatCurrency(dashboard.outflow)} change={dashboard.source === "live" ? "Live API" : "Fixture"} trend="down" icon={ArrowDownRight} />
        <MetricCard label="Needs review" value={`${dashboard.reviewCount} entries`} change="Read-only view" trend="neutral" icon={Clock3} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden border-white/8 bg-card/80 shadow-2xl shadow-black/10">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Cash movement</CardTitle>
              <CardDescription>Validated inflow and outflow across the last six months.</CardDescription>
            </div>
            <StatusBadge status="Reconciled" />
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-end gap-7">
              <div>
                <p className="text-sm text-muted-foreground">Net movement</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">{dashboard.net >= 0 ? "+" : ""}{formatCurrency(dashboard.net)}</p>
              </div>
              <p className="mb-1 flex items-center gap-1 text-sm font-medium text-emerald-300">
                <ArrowUpRight className="size-4" aria-hidden="true" /> 16.8%
              </p>
            </div>
            <div className="grid h-56 grid-cols-6 items-end gap-3 rounded-xl border border-white/7 bg-black/15 p-5" aria-label="Cash movement bar chart">
              {cashFlow.map((point) => (
                <div key={point.month} className="flex h-full flex-col justify-end gap-2">
                  <div className="flex flex-1 items-end justify-center gap-1.5">
                    <div className="w-3 rounded-t bg-cyan-400/85" style={{ height: `${(point.inflow / maxFlow) * 100}%` }} title={`${point.month} inflow ${formatCurrency(point.inflow)}`} />
                    <div className="w-3 rounded-t bg-slate-600" style={{ height: `${(point.outflow / maxFlow) * 100}%` }} title={`${point.month} outflow ${formatCurrency(point.outflow)}`} />
                  </div>
                  <span className="text-center text-xs text-muted-foreground">{point.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-400" />Inflow</span>
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-600" />Outflow</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-card/80 shadow-2xl shadow-black/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-cyan-300" />Control health</CardTitle>
            <CardDescription>Automated checks across the current ledger window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[{ label: "Import integrity", value: 100 }, { label: "Auto-matched", value: 92 }, { label: "Evidence coverage", value: 97 }].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>{item.label}</span><span className="font-mono text-muted-foreground">{item.value}%</span></div>
                <Progress value={item.value} className="h-1.5 bg-white/8 [&_[data-slot=progress-indicator]]:bg-cyan-400" />
              </div>
            ))}
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-cyan-100"><Sparkles className="size-4" />No duplicate imports detected</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Idempotency keys protect all four batches processed this week.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="border-white/8 bg-card/80">
          <CardHeader><CardTitle>Reconciliation queue</CardTitle><CardDescription>Highest-impact variances first.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Account</TableHead><TableHead>Variance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{reconciliationItems.slice(0, 3).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.reference}</TableCell>
                  <TableCell>{item.account}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(item.variance)}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="border-white/8 bg-card/80">
          <CardHeader><CardTitle>Recent imports</CardTitle><CardDescription>Immutable batch history and validation outcomes.</CardDescription></CardHeader>
          <CardContent className="space-y-3">{importBatches.slice(0, 3).map((batch) => (
            <div key={batch.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-black/10 p-4">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{batch.fileName}</p><p className="mt-1 text-xs text-muted-foreground">{batch.entries} entries · {batch.createdAt}</p></div>
              <StatusBadge status={batch.status} />
            </div>
          ))}</CardContent>
        </Card>
      </section>
    </div>
  );
}
