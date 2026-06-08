import { Commit } from "@/types";

export function buildReviewPrompt(commits: Commit[], username: string, repo: string): string {
  const slim = commits.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.message.split("\n")[0],
    date: c.date,
    additions: c.additions,
    deletions: c.deletions,
    files: c.files.map((f) => f.filename),
  }));

  return `You are an expert code reviewer and developer productivity analyst. Analyze the following commit history for ${username} in ${repo} and provide a comprehensive review.

## Commits Data:
${JSON.stringify(slim, null, 2)}

## Instructions:
1. **Summary**: Write a 2-3 sentence summary of what this developer worked on. Be specific about features, fixes, and patterns.
2. **Highlights**: List 3-5 key commits representing significant work. Format as: "type: description" (e.g., "feat: added OAuth login").
3. **Suggestions**: Provide 3-5 actionable improvement suggestions considering code quality, testing, commit message quality, and documentation.
4. **Stats Analysis**: Comment on commit patterns — frequency, consistency, areas of focus.

Respond in this exact JSON format (no markdown, no extra text):
{
  "summary": "...",
  "highlights": ["...", "..."],
  "suggestions": ["...", "..."],
  "statsComment": "..."
}`;
}
