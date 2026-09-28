import { Download, Search } from "lucide-react";
import { PageHeader } from "@/components/ledgerflow/page-header";
import { StatusBadge } from "@/components/ledgerflow/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ledgerEntries } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default function LedgerPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Source of truth" title="Ledger" description="Normalized entries with stable external references, fixed-precision amounts, and provenance for every row." />
      <Card className="border-white/8 bg-card/80">
        <CardHeader className="flex-col gap-3 border-b border-white/7 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search ledger" placeholder="Search ID, account, description…" className="border-white/8 bg-black/10 pl-9" />
          </div>
          <Button variant="outline" className="border-white/10 bg-transparent"><Download className="size-4" />Export CSV</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Entry</TableHead><TableHead>Account</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>{ledgerEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{entry.occurredAt}</TableCell>
                <TableCell><p className="font-medium">{entry.description}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{entry.id}</p></TableCell>
                <TableCell className="whitespace-nowrap">{entry.account}</TableCell>
                <TableCell><span className="rounded-md border border-white/8 bg-white/4 px-2 py-1 text-xs">{entry.source}</span></TableCell>
                <TableCell><StatusBadge status={entry.status} /></TableCell>
                <TableCell className={`text-right font-mono font-medium ${entry.amount > 0 ? "text-emerald-300" : "text-slate-200"}`}>{entry.amount > 0 ? "+" : ""}{formatCurrency(entry.amount)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Showing 6 synthetic entries · Money values are modeled with decimal precision in the API.</p>
    </div>
  );
}
