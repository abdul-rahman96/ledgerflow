"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpenText, ClockArrowDown, FileUp, LayoutDashboard, Menu, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/ledger", label: "Ledger", icon: BookOpenText },
  { href: "/imports", label: "Import & validate", icon: FileUp },
  { href: "/reconciliation", label: "Reconciliation", icon: Scale },
  { href: "/audit", label: "Audit & rollback", icon: ClockArrowDown },
] as const;

function Navigation({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1" aria-label="Primary navigation">
      {navigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.endsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active ? "bg-cyan-300/10 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
            )}
          >
            <Icon className={cn("size-4", active && "text-cyan-300")} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="LedgerFlow home">
      <span className="grid size-9 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/10"><Activity className="size-5" /></span>
      <span><span className="block text-sm font-semibold tracking-tight">LedgerFlow</span><span className="block text-[11px] text-slate-500">Control plane</span></span>
    </Link>
  );
}

export function AppShell({ children, runtimeLabel }: { children: ReactNode; runtimeLabel: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/7 bg-slate-950/55 p-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Brand />
        <div className="mt-9"><Navigation pathname={pathname} /></div>
        <div className="mt-auto rounded-xl border border-white/7 bg-white/[0.025] p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-200"><ShieldCheck className="size-4 text-emerald-300" />Clean-room demo</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Synthetic records only. No legacy code, branding, or credentials.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/7 bg-background/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation"><Menu className="size-5" /></Button></SheetTrigger>
              <SheetContent side="left" className="w-72 border-white/8 bg-slate-950 p-5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
                <div className="mt-9"><Navigation pathname={pathname} /></div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
            {runtimeLabel}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block"><span className="block text-xs font-medium">Portfolio workspace</span><span className="block text-[11px] text-muted-foreground">USD · UTC</span></span>
            <span className="grid size-8 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/8 text-xs font-semibold text-cyan-200">AH</span>
          </div>
        </div>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
