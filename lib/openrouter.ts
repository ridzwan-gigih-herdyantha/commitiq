const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
  "google/gemma-4-31b-it:free",
  "moonshotai/kimi-k2.6:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

type Message = { role: "system" | "user" | "assistant"; content: string };

async function callMessages(messages: Message[], modelIndex = 0): Promise<string> {
  const model = MODELS[modelIndex] ?? MODELS[0];
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://commitiq.vercel.app",
      "X-Title": "CommitIQ",
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 2000 }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`OpenRouter [${model}] ${res.status}:`, body);
    if (modelIndex < MODELS.length - 1) return callMessages(messages, modelIndex + 1);
    throw new Error(`OpenRouter error: ${res.status} — ${body}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export function callLLM(prompt: string): Promise<string> {
  return callMessages([{ role: "user", content: prompt }]);
}

export function callChatLLM(messages: Message[]): Promise<string> {
  return callMessages(messages);
}
