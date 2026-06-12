export interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
  additions: number;
  deletions: number;
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  }[];
}

export interface SavedUser {
  id: string;
  displayName: string;
  username: string;
  pat: string;
}

export interface ReviewRequest {
  username: string;
  repo: string;
  owner: string;
  range?: string;
  maxCommits?: number;
  pat?: string;
  branch?: string;
}

export interface ReviewResponse {
  summary: string;
  highlights: string[];
  suggestions: string[];
  stats: {
    totalCommits: number;
    activeDays: number;
    topFiles: string[];
    categories: Record<string, number>;
    totalAdditions: number;
    totalDeletions: number;
  };
  meta: {
    username: string;
    repo: string;
    dateRange: string;
    generatedAt: string;
  };
}

export interface Repo {
  name: string;
  owner: string;
  description: string | null;
  stargazerCount: number;
  primaryLanguage: string | null;
  updatedAt: string;
}

export interface RepoWithCount extends Repo {
  commitCount: number;
}
