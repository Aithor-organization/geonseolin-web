import { getModel, parseAIJsonResponse, sanitizeInput, withAIRetry } from "./shared";

interface WorkerData {
  name: string;
  specialty: string | null;
  experience: number;
  skills: string[];
  bio: string | null;
  rating: number;
  review_count: number;
  completed_jobs: number;
}

interface JobData {
  title: string;
  location: string | null;
  salary: string | null;
  type: string | null;
  description: string | null;
  requirements: string[];
}

interface GeneratedApplication {
  message: string;
  match_score: number;
  match_reasons: string[];
}

export async function generateApplicationMessage(
  worker: WorkerData,
  job: JobData,
  template?: string | null
): Promise<GeneratedApplication> {
  const model = getModel();

  const prompt = `당신은 건설 인력 매칭 플랫폼 '건설人'의 AI 지원서 작성 도우미입니다.

## 기술자 프로필
- 이름: ${sanitizeInput(worker.name)}
- 전문 분야: ${worker.specialty ?? "미지정"}
- 경력: ${worker.experience}년
- 보유 기술: ${worker.skills.join(", ") || "없음"}
- 자기소개: ${sanitizeInput((worker.bio ?? "").slice(0, 300))}
- 평점: ${worker.rating}/5 (${worker.review_count}명 평가)
- 완료 작업: ${worker.completed_jobs}건

## 공고 정보
- 공고명: ${sanitizeInput(job.title)}
- 위치: ${job.location ?? "미지정"}
- 급여: ${job.salary ?? "미지정"}
- 유형: ${job.type ?? "미지정"}
- 설명: ${sanitizeInput((job.description ?? "").slice(0, 300))}
- 요구사항: ${job.requirements.join(", ") || "없음"}

## 지원서 템플릿 (있는 경우)
${template ? sanitizeInput(template) : "없음 - AI 자동 생성"}

## 작성 규칙
1. 200~500자로 작성
2. 공고 요구사항에 맞는 경력/기술을 구체적으로 언급
3. 전문적이되 자연스러운 어투 사용
4. 거짓 정보 절대 포함 금지 (프로필 정보만 사용)
5. 템플릿이 있으면 구조를 따르되 공고에 맞게 커스터마이즈

## JSON만 출력:
{
  "message": "지원서 본문",
  "match_score": 85,
  "match_reasons": ["이유1", "이유2", "이유3"]
}`;

  return withAIRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return parseAIJsonResponse<GeneratedApplication>(text);
  });
}
