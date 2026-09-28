import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Matched: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  Reconciled: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  Committed: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  Valid: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  Review: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  Investigating: "border-violet-300/20 bg-violet-300/10 text-violet-200",
  Duplicate: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  Rejected: "border-red-300/20 bg-red-300/10 text-red-200",
  "Rolled back": "border-slate-300/20 bg-slate-300/10 text-slate-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", statusStyles[status])}>
      {status}
    </Badge>
  );
}
