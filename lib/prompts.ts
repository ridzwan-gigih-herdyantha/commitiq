import { Commit, ReviewResponse } from "@/types";

export function buildReviewPrompt(commits: Commit[], username: string, repo: string): string {
  const slim = commits.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.message.split("\n")[0],
    date: c.date,
    additions: c.additions,
    deletions: c.deletions,
    files: c.files.map((f) => f.filename),
  }));

  return `You are an expert code reviewer. Analyze the following commit history for ${username} in ${repo} and provide a comprehensive review.

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

export function buildChatSystemPrompt(review: ReviewResponse, taskNotes?: string): string {
  const { meta, stats, summary, highlights, suggestions } = review;

  const reviewSection = `## Commit Review Context
Repository: ${meta.repo}
Developer: ${meta.username}
Date: ${meta.dateRange}

Summary: ${summary}

Key commits:
${highlights.map((h) => `- ${h}`).join("\n")}

AI suggestions:
${suggestions.map((s) => `- ${s}`).join("\n")}

Stats: ${stats.totalCommits} commits, ${stats.totalAdditions} additions, ${stats.totalDeletions} deletions
Commit types: ${Object.entries(stats.categories).map(([k, v]) => `${k}(${v})`).join(", ")}`;

  const notesSection = taskNotes?.trim()
    ? `\n\n## Task / Lead Dev Notes provided by user:\n${taskNotes.trim()}`
    : "";

  return `You are a senior developer assistant helping a developer understand how well their commits align with their tasks or lead dev notes.

${reviewSection}${notesSection}

Answer the user's questions concisely and directly. When asked about alignment with a task or notes:
- Compare each relevant commit against the requirements
- Clearly state what is covered, what is missing, and what might be off-track
- Be specific, not generic
- Keep answers under 300 words unless detail is explicitly requested`;
}
