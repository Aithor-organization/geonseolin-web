import { getModel, parseAIJsonResponse, sanitizeInput, withAIRetry } from "./shared";

interface BotContext {
  company_name: string;
  industry: string | null;
  employees: string | null;
  address: string | null;
  description: string | null;
  active_jobs: { title: string; location: string | null; salary: string | null }[];
  faq: { question: string; answer: string; id: string }[];
  recent_messages: { sender: string; text: string }[];
  tone: "formal" | "polite" | "concise";
}

interface BotResponse {
  response: string;
  confidence: number;
  should_escalate: boolean;
  escalation_reason: string | null;
  matched_faq_id: string | null;
}

export function checkEscalation(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

export function isWithinSchedule(
  mode: string,
  customStart?: string | null,
  customEnd?: string | null
): boolean {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const current = h * 60 + m;

  if (mode === "always") return true;

  if (mode === "off_hours") {
    return current < 540 || current >= 1080; // before 09:00 or after 18:00
  }

  if (mode === "custom" && customStart && customEnd) {
    const [sh, sm] = customStart.split(":").map(Number);
    const [eh, em] = customEnd.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (start <= end) return current >= start && current < end;
    return current >= start || current < end; // overnight
  }

  return false;
}

export async function generateBotResponse(ctx: BotContext): Promise<BotResponse> {
  const model = getModel();

  const toneGuide: Record<string, string> = {
    formal: '"~입니다", "~하시기 바랍니다"',
    polite: '"~해요", "~드려요"',
    concise: "핵심만 간결하게",
  };

  const faqList = ctx.faq
    .map((f) => `Q: ${f.question}\nA: ${f.answer} (id: ${f.id})`)
    .join("\n\n");

  const jobsList = ctx.active_jobs
    .map((j) => `- ${j.title} (위치: ${j.location ?? "미정"}, 급여: ${j.salary ?? "미정"})`)
    .join("\n");

  const history = ctx.recent_messages
    .map((m) => `${m.sender}: ${m.text}`)
    .join("\n");

  const prompt = `당신은 건설 기업 "${sanitizeInput(ctx.company_name)}"의 AI 상담 도우미입니다.
기술자의 질문에 기업 정보를 기반으로 정확하게 답변하세요.

## 기업 정보
- 회사명: ${sanitizeInput(ctx.company_name)}
- 업종: ${ctx.industry ?? "미지정"}
- 규모: ${ctx.employees ?? "미지정"}
- 주소: ${ctx.address ?? "미지정"}
- 소개: ${sanitizeInput((ctx.description ?? "").slice(0, 300))}

## 현재 진행 중인 공고
${jobsList || "없음"}

## FAQ (우선 참조)
${faqList || "없음"}

## 최근 대화 히스토리
${history || "없음"}

## 답변 스타일: ${ctx.tone}
${toneGuide[ctx.tone] ?? toneGuide.polite}

## 답변 규칙
1. FAQ에 일치하는 질문이 있으면 FAQ 답변을 우선 사용
2. 기업 정보/공고에서 확인 가능한 내용만 답변
3. 확인 불가능한 내용은 "담당자에게 확인 후 안내드리겠습니다"로 응대
4. 급여 협상, 계약 조건 등 민감한 주제는 에스컬레이션
5. 짧고 명확하게 답변 (최대 300자)

## JSON만 출력:
{
  "response": "답변 내용",
  "confidence": 0.85,
  "should_escalate": false,
  "escalation_reason": null,
  "matched_faq_id": null
}`;

  return withAIRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return parseAIJsonResponse<BotResponse>(text);
  });
}
