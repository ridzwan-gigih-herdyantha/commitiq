import { Commit, Repo, RepoWithCount } from "@/types";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_REST = "https://api.github.com";

const makeHeaders = (token?: string) => ({
  Authorization: `Bearer ${token ?? process.env.GITHUB_PAT}`,
  "Content-Type": "application/json",
});

const USER_QUERY = `
  query($login: String!) {
    user(login: $login) {
      id
      name
      avatarUrl
    }
  }
`;

const REPOS_QUERY = `
  query($login: String!, $first: Int!) {
    user(login: $login) {
      repositories(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}, ownerAffiliations: OWNER) {
        nodes {
          name
          owner { login }
          description
          stargazerCount
          primaryLanguage { name }
          updatedAt
        }
      }
    }
  }
`;

async function graphql<T>(query: string, variables: Record<string, unknown>, token?: string): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: makeHeaders(token),
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

export async function getUser(login: string, token?: string) {
  const data = await graphql<{ user: { id: string; name: string; avatarUrl: string } }>(
    USER_QUERY,
    { login },
    token
  );
  return data.user;
}

export async function getUserRepos(login: string, token?: string) {
  const data = await graphql<{
    user: {
      repositories: {
        nodes: {
          name: string;
          owner: { login: string };
          description: string | null;
          stargazerCount: number;
          primaryLanguage: { name: string } | null;
          updatedAt: string;
        }[];
      };
    };
  }>(REPOS_QUERY, { login, first: 30 }, token);

  return data.user.repositories.nodes.map((r) => ({
    name: r.name,
    owner: r.owner.login,
    description: r.description,
    stargazerCount: r.stargazerCount,
    primaryLanguage: r.primaryLanguage?.name ?? null,
    updatedAt: r.updatedAt,
  }));
}

export async function getBranchesWithTodayCommits(
  owner: string,
  repo: string,
  author: string,
  token?: string
): Promise<string[]> {
  const branchesRes = await fetch(
    `${GITHUB_REST}/repos/${owner}/${repo}/branches?per_page=100`,
    { headers: makeHeaders(token) }
  );
  if (!branchesRes.ok) return [];
  const branches: { name: string }[] = await branchesRes.json();

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const sinceISO = since.toISOString();

  const results = await Promise.all(
    branches.slice(0, 30).map(async (branch) => {
      const res = await fetch(
        `${GITHUB_REST}/repos/${owner}/${repo}/commits?author=${encodeURIComponent(author)}&since=${sinceISO}&sha=${encodeURIComponent(branch.name)}&per_page=1`,
        { headers: makeHeaders(token) }
      );
      if (!res.ok) return null;
      const commits = await res.json();
      return Array.isArray(commits) && commits.length > 0 ? branch.name : null;
    })
  );

  return results.filter((b): b is string => b !== null);
}

export async function getCommits(
  owner: string,
  repo: string,
  author: string,
  since: string,
  maxCommits = 50,
  token?: string,
  branch?: string
): Promise<Commit[]> {
  const branchParam = branch ? `&sha=${encodeURIComponent(branch)}` : "";
  const url = `${GITHUB_REST}/repos/${owner}/${repo}/commits?author=${author}&since=${since}&per_page=${Math.min(maxCommits, 100)}${branchParam}`;
  const res = await fetch(url, { headers: makeHeaders(token) });
  if (!res.ok) throw new Error(`GitHub REST error: ${res.status}`);
  const commits = await res.json();

  const results: Commit[] = [];
  for (const c of commits.slice(0, maxCommits)) {
    const detail = await fetch(`${GITHUB_REST}/repos/${owner}/${repo}/commits/${c.sha}`, {
      headers: makeHeaders(token),
    }).then((r) => r.json());

    results.push({
      sha: c.sha,
      message: c.commit.message,
      date: c.commit.author.date,
      author: c.commit.author.name,
      url: c.html_url,
      additions: detail.stats?.additions ?? 0,
      deletions: detail.stats?.deletions ?? 0,
      files: (detail.files ?? []).slice(0, 5).map(
        (f: { filename: string; status: string; additions: number; deletions: number; patch?: string }) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch?.slice(0, 500),
        })
      ),
    });
  }
  return results;
}

export async function getReposWithTodayCommits(username: string, token?: string): Promise<RepoWithCount[]> {
  const today = new Date().toISOString().slice(0, 10);
  const url = `${GITHUB_REST}/search/commits?q=author:${encodeURIComponent(username)}+committer-date:${today}&per_page=100&sort=committer-date&order=desc`;
  const res = await fetch(url, {
    headers: {
      ...makeHeaders(token),
      Accept: "application/vnd.github.cloak-preview+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub search error: ${res.status}`);
  const data = await res.json();

  const repoMap = new Map<string, RepoWithCount>();
  for (const item of data.items ?? []) {
    const r = item.repository;
    const key: string = r.full_name;
    if (repoMap.has(key)) {
      repoMap.get(key)!.commitCount++;
    } else {
      repoMap.set(key, {
        name: r.name,
        owner: r.owner.login,
        description: r.description ?? null,
        stargazerCount: r.stargazers_count ?? 0,
        primaryLanguage: null,
        updatedAt: r.updated_at,
        commitCount: 1,
      });
    }
  }

  return Array.from(repoMap.values());
}

export function rangeToSince(range: string): string {
  if (range === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range.startsWith("custom:")) {
    const date = range.slice(7);
    return new Date(`${date}T00:00:00`).toISOString();
  }
  const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "all" ? 365 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
