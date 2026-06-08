"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewRequest, Repo } from "@/types";

interface Props {
  onSubmit: (req: ReviewRequest) => void;
  loading: boolean;
}

export function SearchForm({ onSubmit, loading }: Props) {
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [range, setRange] = useState("30d");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState("");

  useEffect(() => {
    if (!username.trim()) { setRepos([]); setSelectedRepo(""); return; }
    const t = setTimeout(async () => {
      setRepoLoading(true);
      setRepoError("");
      try {
        const res = await fetch(`/api/repos?username=${encodeURIComponent(username.trim())}`);
        const data = await res.json();
        if (data.error) { setRepoError(data.error); setRepos([]); }
        else { setRepos(data.repos); setSelectedRepo(""); }
      } catch {
        setRepoError("Failed to fetch repos");
      } finally {
        setRepoLoading(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [username]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !selectedRepo) return;
    const [owner, repo] = selectedRepo.includes("/")
      ? selectedRepo.split("/")
      : [username.trim(), selectedRepo];
    const resolvedRange = range === "custom" ? `custom:${customDate}` : range;
    onSubmit({ username: username.trim(), repo, owner, range: resolvedRange });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium mb-1 block text-muted-foreground">GitHub Username</label>
        <Input
          placeholder="e.g. torvalds"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block text-muted-foreground">Repository</label>
        <Select
          value={selectedRepo}
          onValueChange={(v) => setSelectedRepo(v ?? "")}
          disabled={loading || repoLoading || repos.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={repoLoading ? "Loading repos…" : "Select a repo"} />
          </SelectTrigger>
          <SelectContent>
            {repos.map((r) => (
              <SelectItem key={r.name} value={`${r.owner}/${r.name}`}>
                {r.name}
                {r.primaryLanguage && (
                  <span className="ml-2 text-xs text-muted-foreground">{r.primaryLanguage}</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {repoError && <p className="text-xs text-destructive mt-1">{repoError}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block text-muted-foreground">Date Range</label>
        <Select value={range} onValueChange={(v) => setRange(v ?? "30d")} disabled={loading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">Last year</SelectItem>
            <SelectItem value="custom">Custom date…</SelectItem>
          </SelectContent>
        </Select>
        {range === "custom" && (
          <input
            type="date"
            value={customDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setCustomDate(e.target.value)}
            disabled={loading}
            className="mt-2 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        )}
      </div>

      <Button type="submit" disabled={loading || !username.trim() || !selectedRepo} className="w-full">
        {loading ? "Analyzing…" : "Analyze Commits"}
      </Button>
    </form>
  );
}
