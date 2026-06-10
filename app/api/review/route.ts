import { NextRequest, NextResponse } from "next/server";
import { getCommits, rangeToSince } from "@/lib/github";
import { callLLM } from "@/lib/openrouter";
import { buildReviewPrompt } from "@/lib/prompts";
import { categorizeCommits, getActiveDays, getTopFiles } from "@/lib/utils";
import { ReviewRequest, ReviewResponse } from "@/types";

export async function POST(req: NextRequest) {
  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, repo, owner, range = "30d", maxCommits = 50, pat } = body;
  if (!username || !repo || !owner) {
    return NextResponse.json({ error: "username, repo, owner required" }, { status: 400 });
  }

  try {
    const since = rangeToSince(range);
    const commits = await getCommits(owner, repo, username, since, maxCommits, pat);

    if (commits.length === 0) {
      return NextResponse.json({ error: "No commits found for this range" }, { status: 404 });
    }

    const prompt = buildReviewPrompt(commits, username, repo);
    const raw = await callLLM(prompt);

    let parsed: { summary: string; highlights: string[]; suggestions: string[]; statsComment: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("LLM returned invalid JSON");
      parsed = JSON.parse(match[0]);
    }

    const totalAdditions = commits.reduce((s, c) => s + c.additions, 0);
    const totalDeletions = commits.reduce((s, c) => s + c.deletions, 0);

    const response: ReviewResponse = {
      summary: parsed.summary,
      highlights: parsed.highlights ?? [],
      suggestions: parsed.suggestions ?? [],
      stats: {
        totalCommits: commits.length,
        activeDays: getActiveDays(commits),
        topFiles: getTopFiles(commits),
        categories: categorizeCommits(commits),
        totalAdditions,
        totalDeletions,
      },
      meta: {
        username,
        repo: `${owner}/${repo}`,
        dateRange: range,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
