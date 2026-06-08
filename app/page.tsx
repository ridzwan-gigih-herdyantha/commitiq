"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { SummaryCard } from "@/components/SummaryCard";
import { StatsPanel } from "@/components/StatsPanel";
import { HighlightsList } from "@/components/HighlightsList";
import { SuggestionsList } from "@/components/SuggestionsList";
import { LoadingState } from "@/components/LoadingState";
import { ReviewRequest, ReviewResponse } from "@/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState("");

  async function handleReview(req: ReviewRequest) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">CommitIQ</h1>
          <p className="text-muted-foreground">AI-powered commit history review for any GitHub repo</p>
        </header>

        <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
          <SearchForm onSubmit={handleReview} loading={loading} />
        </div>

        {loading && <LoadingState />}

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <SummaryCard data={result} />
            <StatsPanel data={result} />
            <HighlightsList highlights={result.highlights} />
            <SuggestionsList suggestions={result.suggestions} />
          </div>
        )}
      </div>
    </main>
  );
}
