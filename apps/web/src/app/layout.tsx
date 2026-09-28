import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AppShell } from "@/components/ledgerflow/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "LedgerFlow — Reconciliation Control Plane",
  description:
    "A clean-room financial data operations demo for reliable imports, reconciliation, and reversible ledger changes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const runtimeLabel = process.env.LEDGERFLOW_API_URL
    ? "Live API · browser writes locked"
    : "Fixture workspace · keyless";
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <TooltipProvider>
          <AppShell runtimeLabel={runtimeLabel}>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
