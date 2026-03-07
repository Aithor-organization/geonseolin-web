const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite-preview";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");
  return key;
}

// Gemini SDK 호환 인터페이스 래퍼
interface GenerateResult {
  response: { text: () => string };
}

interface AIModel {
  generateContent: (prompt: string) => Promise<GenerateResult>;
}

export function getModel(modelName = DEFAULT_MODEL): AIModel {
  return {
    async generateContent(prompt: string): Promise<GenerateResult> {
      const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter API error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      return { response: { text: () => content } };
    },
  };
}

export function parseAIJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/['"`;\\]/g, "")
    .replace(/--/g, "")
    .trim()
    .slice(0, 2000);
}

export async function withAIRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}
