import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: LucideIcon;
};

export function MetricCard({ label, value, change, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card className="border-white/8 bg-card/80 transition-colors hover:border-cyan-300/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="rounded-lg border border-white/8 bg-white/4 p-2 text-cyan-300"><Icon className="size-4" aria-hidden="true" /></span>
        </div>
        <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
        <p className={cn("mt-2 flex items-center gap-1 text-xs", trend === "up" && "text-emerald-300", trend === "down" && "text-slate-400", trend === "neutral" && "text-amber-200")}>
          {trend === "up" ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : null}
          {change}
        </p>
      </CardContent>
    </Card>
  );
}
