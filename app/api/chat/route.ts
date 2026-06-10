import { NextRequest, NextResponse } from "next/server";
import { callChatLLM } from "@/lib/openrouter";
import { buildChatSystemPrompt } from "@/lib/prompts";
import { ReviewResponse } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  review: ReviewResponse;
  taskNotes?: string;
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, review, taskNotes } = body;
  if (!messages?.length || !review) {
    return NextResponse.json({ error: "messages and review are required" }, { status: 400 });
  }

  try {
    const systemPrompt = buildChatSystemPrompt(review, taskNotes);
    const reply = await callChatLLM([
      { role: "system", content: systemPrompt },
      ...messages,
    ]);
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
