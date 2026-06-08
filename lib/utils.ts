import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Commit } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getCommitType(message: string): string {
  const m = message.toLowerCase();
  if (m.startsWith("feat")) return "feat";
  if (m.startsWith("fix")) return "fix";
  if (m.startsWith("refactor")) return "refactor";
  if (m.startsWith("docs")) return "docs";
  if (m.startsWith("test")) return "test";
  if (m.startsWith("chore")) return "chore";
  return "other";
}

export function categorizeCommits(commits: Commit[]): Record<string, number> {
  return commits.reduce((acc, c) => {
    const type = getCommitType(c.message);
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function getActiveDays(commits: Commit[]): number {
  const days = new Set(commits.map((c) => c.date.slice(0, 10)));
  return days.size;
}

export function getTopFiles(commits: Commit[], limit = 5): string[] {
  const counts: Record<string, number> = {};
  for (const c of commits) {
    for (const f of c.files) {
      counts[f.filename] = (counts[f.filename] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([f]) => f);
}

