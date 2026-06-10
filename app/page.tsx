"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/SummaryCard";
import { StatsPanel } from "@/components/StatsPanel";
import { HighlightsList } from "@/components/HighlightsList";
import { SuggestionsList } from "@/components/SuggestionsList";
import { LoadingState } from "@/components/LoadingState";
import { UserManager } from "@/components/UserManager";
import { TodayReposPicker } from "@/components/TodayReposPicker";
import { ChatPanel } from "@/components/ChatPanel";
import { SavedUser, ReviewResponse, RepoWithCount } from "@/types";

const STORAGE_KEY = "commitiq_users";

function loadUsers(): SavedUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: SavedUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export default function Home() {
  const [users, setUsers] = useState<SavedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SavedUser | null>(null);
  const [showManager, setShowManager] = useState(false);

  const [todayRepos, setTodayRepos] = useState<RepoWithCount[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState("");

  const [selectedRepo, setSelectedRepo] = useState<RepoWithCount | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResponse | null>(null);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  const fetchTodayRepos = useCallback(async (user: SavedUser) => {
    setReposLoading(true);
    setReposError("");
    setTodayRepos([]);
    setSelectedRepo(null);
    setReviewResult(null);
    setReviewError("");
    try {
      const res = await fetch("/api/repos/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, pat: user.pat }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch repos");
      setTodayRepos(data.repos);
    } catch (err) {
      setReposError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setReposLoading(false);
    }
  }, []);

  function handleSelectUser(user: SavedUser) {
    setSelectedUser(user);
    fetchTodayRepos(user);
  }

  function handleSaveUsers(updated: SavedUser[]) {
    saveUsers(updated);
    setUsers(updated);
  }

  async function handleSelectRepo(repo: RepoWithCount) {
    if (!selectedUser) return;
    setSelectedRepo(repo);
    setReviewLoading(true);
    setReviewError("");
    setReviewResult(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedUser.username,
          repo: repo.name,
          owner: repo.owner,
          range: "today",
          pat: selectedUser.pat,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      setReviewResult(data);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">CommitIQ</h1>
          <p className="text-muted-foreground">AI review of your commits today</p>
        </header>

        {/* Step 1: User selection */}
        <div className="bg-card border rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Select User
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowManager(true)}>
              Manage Users
            </Button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No users saved yet.</p>
              <Button onClick={() => setShowManager(true)}>+ Add Your First User</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors hover:bg-accent ${
                    selectedUser?.id === u.id ? "border-primary bg-accent" : "bg-background"
                  }`}
                >
                  <span className="font-medium text-sm">{u.displayName}</span>
                  <span className="text-muted-foreground text-sm ml-2">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Repos with today's commits */}
        {selectedUser && (
          <div className="bg-card border rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Repos with commits today
              </h2>
              {!reposLoading && (
                <button
                  onClick={() => fetchTodayRepos(selectedUser)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Refresh
                </button>
              )}
            </div>
            <TodayReposPicker
              repos={todayRepos}
              loading={reposLoading}
              error={reposError}
              onSelect={handleSelectRepo}
              selectedRepo={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.name}` : null}
            />
          </div>
        )}

        {/* Step 3: Review results */}
        {selectedRepo && (
          <>
            {reviewLoading && <LoadingState />}

            {reviewError && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {reviewError}
              </div>
            )}

            {reviewResult && !reviewLoading && (
              <div className="space-y-4">
                <SummaryCard data={reviewResult} />
                <StatsPanel data={reviewResult} />
                <HighlightsList highlights={reviewResult.highlights} />
                <SuggestionsList suggestions={reviewResult.suggestions} />
                <ChatPanel review={reviewResult} />
              </div>
            )}
          </>
        )}
      </div>

      {showManager && (
        <UserManager
          users={users}
          onClose={() => setShowManager(false)}
          onSave={handleSaveUsers}
        />
      )}
    </main>
  );
}
