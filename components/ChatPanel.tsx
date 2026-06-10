"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReviewResponse } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  review: ReviewResponse;
}

export function ChatPanel({ review }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [taskNotes, setTaskNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, review, taskNotes: taskNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Chat with AI</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tanya apakah commit kamu sudah sesuai dengan task atau catatan lead dev
          </p>
        </div>
        <button
          onClick={() => setShowNotes((s) => !s)}
          className="text-xs text-muted-foreground hover:text-foreground border rounded-md px-2.5 py-1"
        >
          {showNotes ? "Hide notes" : "+ Task / Lead Notes"}
        </button>
      </div>

      {showNotes && (
        <div className="px-5 py-3 border-b bg-muted/30">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Paste task description or lead dev notes here
          </label>
          <textarea
            value={taskNotes}
            onChange={(e) => setTaskNotes(e.target.value)}
            placeholder="e.g. Task: implement OAuth login, add unit tests for auth module, update API docs..."
            rows={4}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 px-5 py-4 min-h-[120px] max-h-[400px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Tanyakan apa saja tentang commit hari ini.{" "}
            {!showNotes && (
              <button
                onClick={() => setShowNotes(true)}
                className="underline hover:text-foreground"
              >
                Tambah task/notes
              </button>
            )}{" "}
            untuk cek alignment.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya sesuatu tentang commit ini…"
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
