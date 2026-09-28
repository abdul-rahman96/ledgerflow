import { ArrowRight, CircleCheck, Filter, Scale } from "lucide-react";
import { PageHeader } from "@/components/ledgerflow/page-header";
import { StatusBadge } from "@/components/ledgerflow/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { getReconciliations } from "@/lib/live-data";

export default async function ReconciliationPage() {
  const { data: reconciliationItems } = await getReconciliations();
  const openVariance = reconciliationItems.reduce((sum, item) => sum + Math.abs(item.variance), 0);
  const openItems = reconciliationItems.filter((item) => item.variance !== 0).length;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Exception management" title="Reconciliation queue" description="Compare source evidence against normalized ledger values, prioritize material variance, and preserve every resolution decision." />
      <section className="grid gap-4 md:grid-cols-3">
        {[{ label: "Queue coverage", value: `${reconciliationItems.length} items`, detail: "Current reconciliation window", icon: CircleCheck }, { label: "Open variance", value: formatCurrency(openVariance), detail: `Across ${openItems} entries`, icon: Scale }, { label: "Mutation access", value: "Locked", detail: "Operator key required", icon: ArrowRight }].map((item) => (
          <Card key={item.label} className="border-white/8 bg-card/80"><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-3 text-2xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><item.icon className="size-5 text-cyan-300" /></CardContent></Card>
        ))}
      </section>
      <Card className="border-white/8 bg-card/80">
        <CardHeader className="flex-row items-center justify-between gap-4"><div><CardTitle>Current window</CardTitle><CardDescription>Sorted by absolute variance and age.</CardDescription></div><Button variant="outline" className="border-white/10 bg-transparent"><Filter className="size-4" />Filter</Button></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Ledger</TableHead><TableHead className="text-right">Source</TableHead><TableHead className="text-right">Variance</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{reconciliationItems.map((item) => (
              <TableRow key={item.id}><TableCell><p className="font-mono text-xs">{item.reference}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.id}</p></TableCell><TableCell>{item.account}</TableCell><TableCell className="text-right font-mono">{formatCurrency(item.ledgerAmount)}</TableCell><TableCell className="text-right font-mono">{formatCurrency(item.sourceAmount)}</TableCell><TableCell className={`text-right font-mono ${item.variance === 0 ? "text-emerald-300" : "text-amber-200"}`}>{formatCurrency(item.variance)}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell><Button variant="ghost" size="sm">Inspect <ArrowRight className="size-3.5" /></Button></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
