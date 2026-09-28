import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PageHeader({ eyebrow, title, description, actionHref, actionLabel }: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
          <Link href={actionHref}><Plus className="size-4" />{actionLabel}</Link>
        </Button>
      ) : null}
    </header>
  );
}
