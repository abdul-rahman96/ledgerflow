"use client";

import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <TriangleAlert aria-hidden="true" />
      <h1>Operator workspace unavailable</h1>
      <p>The request failed closed. No ledger mutation was attempted.</p>
      <button className="button primary" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
