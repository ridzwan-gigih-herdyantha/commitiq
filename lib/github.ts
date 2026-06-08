import { Commit } from "@/types";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_REST = "https://api.github.com";

const headers = () => ({
  Authorization: `Bearer ${process.env.GITHUB_PAT}`,
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

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

export async function getUser(login: string) {
  const data = await graphql<{ user: { id: string; name: string; avatarUrl: string } }>(
    USER_QUERY,
    { login }
  );
  return data.user;
}

export async function getUserRepos(login: string) {
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
  }>(REPOS_QUERY, { login, first: 30 });

  return data.user.repositories.nodes.map((r) => ({
    name: r.name,
    owner: r.owner.login,
    description: r.description,
    stargazerCount: r.stargazerCount,
    primaryLanguage: r.primaryLanguage?.name ?? null,
    updatedAt: r.updatedAt,
  }));
}

export async function getCommits(
  owner: string,
  repo: string,
  author: string,
  since: string,
  maxCommits = 50
): Promise<Commit[]> {
  const url = `${GITHUB_REST}/repos/${owner}/${repo}/commits?author=${author}&since=${since}&per_page=${Math.min(maxCommits, 100)}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`GitHub REST error: ${res.status}`);
  const commits = await res.json();

  const results: Commit[] = [];
  for (const c of commits.slice(0, maxCommits)) {
    const detail = await fetch(`${GITHUB_REST}/repos/${owner}/${repo}/commits/${c.sha}`, {
      headers: headers(),
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
