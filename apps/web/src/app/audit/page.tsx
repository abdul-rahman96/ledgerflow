import { CheckCircle2, Info, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/ledgerflow/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuditEvents, getImportBatches } from "@/lib/live-data";
import { cn } from "@/lib/utils";

const iconByTone = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

export default async function AuditPage() {
  const [{ data: auditEvents }, { data: importBatches }] = await Promise.all([
    getAuditEvents(),
    getImportBatches(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Evidence & recovery" title="Audit timeline" description="Immutable events explain who changed what and when. Reversible batches preserve the original evidence instead of erasing history." />
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-white/8 bg-card/80">
          <CardHeader><CardTitle>Event history</CardTitle><CardDescription>UTC timestamps and stable entity references.</CardDescription></CardHeader>
          <CardContent>
            <ol className="relative space-y-7 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-white/10">
              {auditEvents.map((event) => {
                const Icon = iconByTone[event.tone];
                return (
                  <li key={event.id} className="relative flex gap-4">
                    <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full border bg-card", event.tone === "success" && "border-emerald-300/25 text-emerald-300", event.tone === "info" && "border-cyan-300/25 text-cyan-300", event.tone === "warning" && "border-amber-300/25 text-amber-300")}><Icon className="size-4" /></span>
                    <div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{event.action}</p><time className="font-mono text-[11px] text-muted-foreground">{event.date} · {event.time} UTC</time></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{event.detail}</p><div className="mt-2 flex gap-2"><Badge variant="outline" className="font-mono text-[10px]">{event.entity}</Badge><Badge variant="outline" className="text-[10px]">{event.actor}</Badge></div></div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="border-amber-300/15 bg-amber-300/[0.035]">
            <CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="size-5 text-amber-300" />Rollback a batch</CardTitle><CardDescription>Creates compensating records and retains the original import evidence.</CardDescription></CardHeader>
            <CardContent className="space-y-3">{importBatches.filter((batch) => batch.status === "Committed").slice(0, 2).map((batch) => (
              <div key={batch.id} className="rounded-xl border border-white/8 bg-black/10 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{batch.fileName}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{batch.id} · {batch.entries} entries</p></div><Button variant="outline" size="sm" disabled className="border-amber-300/20 bg-transparent text-amber-100">Operator only</Button></div></div>
            ))}</CardContent>
          </Card>
          <Card className="border-white/8 bg-card/80"><CardContent className="p-5"><p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-emerald-300" />Audit guarantees</p><ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground"><li>• Append-only event history</li><li>• Actor and UTC timestamp on every mutation</li><li>• Compensating rollback, never destructive deletion</li><li>• JSON metadata for forensic context</li></ul></CardContent></Card>
        </div>
      </section>
    </div>
  );
}
