"use client";

import { RepoWithCount } from "@/types";

interface Props {
  repos: RepoWithCount[];
  loading: boolean;
  error: string;
  onSelect: (repo: RepoWithCount) => void;
  selectedRepo: string | null;
}

export function TodayReposPicker({ repos, loading, error, onSelect, selectedRepo }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg border bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">{error}</p>
    );
  }

  if (repos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No commits found today.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {repos.map((repo) => {
        const key = `${repo.owner}/${repo.name}`;
        const isSelected = selectedRepo === key;
        return (
          <li key={key}>
            <button
              onClick={() => onSelect(repo)}
              className={`w-full text-left rounded-lg border px-4 py-3 transition-colors hover:bg-accent ${
                isSelected ? "border-primary bg-accent" : "bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{repo.name}</span>
                  {repo.primaryLanguage && (
                    <span className="ml-2 text-xs text-muted-foreground">{repo.primaryLanguage}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {repo.commitCount} commit{repo.commitCount !== 1 ? "s" : ""} today
                </span>
              </div>
              {repo.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{repo.description}</p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
