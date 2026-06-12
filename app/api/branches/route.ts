import { NextRequest, NextResponse } from "next/server";
import { getBranchesWithTodayCommits } from "@/lib/github";

export async function POST(req: NextRequest) {
  let body: { username: string; owner: string; repo: string; pat?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, owner, repo, pat } = body;
  if (!username || !owner || !repo) {
    return NextResponse.json({ error: "username, owner, repo required" }, { status: 400 });
  }

  try {
    const branches = await getBranchesWithTodayCommits(owner, repo, username, pat);
    return NextResponse.json({ branches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
