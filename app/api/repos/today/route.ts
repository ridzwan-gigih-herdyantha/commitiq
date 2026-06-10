import { NextRequest, NextResponse } from "next/server";
import { getReposWithTodayCommits } from "@/lib/github";

export async function POST(req: NextRequest) {
  let body: { username: string; pat?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, pat } = body;
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  try {
    const repos = await getReposWithTodayCommits(username, pat);
    return NextResponse.json({ repos });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
