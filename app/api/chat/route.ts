import { NextRequest, NextResponse } from "next/server";
import { callChatLLM } from "@/lib/openrouter";
import { buildChatSystemPrompt } from "@/lib/prompts";
import { detectInjection, sanitizeInput, MAX_NOTES_LENGTH, MAX_CONVERSATION_TURNS } from "@/lib/security";
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

const INJECTION_REPLY = "I can only help with questions about the commits shown above.";

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, review, taskNotes } = body;

  if (!Array.isArray(messages) || messages.length === 0 || !review) {
    return NextResponse.json({ error: "messages and review are required" }, { status: 400 });
  }

  // Reject oversized conversation (context stuffing)
  if (messages.length > MAX_CONVERSATION_TURNS * 2) {
    return NextResponse.json({ error: "Conversation too long" }, { status: 400 });
  }

  // Validate message structure — only allow user/assistant roles
  for (const msg of messages) {
    if (msg.role !== "user" && msg.role !== "assistant") {
      return NextResponse.json({ error: "Invalid message role" }, { status: 400 });
    }
    if (typeof msg.content !== "string") {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 });
    }
  }

  // Sanitize and check injection on all user messages
  const sanitizedMessages: ChatMessage[] = messages.map((msg) => {
    if (msg.role !== "user") return msg;
    const clean = sanitizeInput(msg.content);

    // Wrap user content so the model can distinguish it from instructions
    return { role: "user", content: `<user_message>${clean}</user_message>` };
  });

  // Check latest user message for injection — short-circuit before calling LLM
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg && detectInjection(lastUserMsg.content)) {
    return NextResponse.json({ reply: INJECTION_REPLY });
  }

  // Sanitize task notes
  const cleanNotes = taskNotes ? sanitizeInput(taskNotes, MAX_NOTES_LENGTH) : undefined;

  try {
    const systemPrompt = buildChatSystemPrompt(review, cleanNotes);
    const reply = await callChatLLM([
      { role: "system", content: systemPrompt },
      ...sanitizedMessages,
    ]);
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
