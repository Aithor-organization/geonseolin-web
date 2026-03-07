import { getModel, parseAIJsonResponse, sanitizeInput, withAIRetry } from "./shared";

interface ApplicantData {
  worker_name: string;
  specialty: string | null;
  experience: number;
  skills: string[];
  bio: string | null;
  location: string | null;
  hourly_rate: number;
  rating: number;
  review_count: number;
  completed_jobs: number;
  application_message: string | null;
}

interface JobData {
  title: string;
  location: string | null;
  salary: string | null;
  type: string | null;
  description: string | null;
  requirements: string[];
  benefits: string[];
}

export interface AnalysisResult {
  match_score: number;
  match_grade: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  score_breakdown: Record<string, { score: number; max: number; detail: string }>;
}

export async function analyzeApplicant(
  job: JobData,
  applicant: ApplicantData
): Promise<AnalysisResult> {
  const model = getModel();

  const prompt = `당신은 건설 인력 매칭 플랫폼 '건설人'의 AI 지원자 분석 전문가입니다.
공고 요구사항과 지원자 프로필을 비교하여 적합도를 평가하세요.

## 공고 정보
- 공고명: ${sanitizeInput(job.title)}
- 위치: ${job.location ?? "미지정"}
- 급여: ${job.salary ?? "미지정"}
- 유형: ${job.type ?? "미지정"}
- 설명: ${sanitizeInput((job.description ?? "").slice(0, 300))}
- 요구사항: ${job.requirements.join(", ") || "없음"}
- 복리후생: ${job.benefits.join(", ") || "없음"}

## 지원자 프로필
- 이름: ${sanitizeInput(applicant.worker_name)}
- 전문 분야: ${applicant.specialty ?? "미지정"}
- 경력: ${applicant.experience}년
- 보유 기술: ${applicant.skills.join(", ") || "없음"}
- 자기소개: ${sanitizeInput((applicant.bio ?? "").slice(0, 200))}
- 지역: ${applicant.location ?? "미지정"}
- 시급: ${applicant.hourly_rate}원
- 평점: ${applicant.rating}/5 (${applicant.review_count}명)
- 완료 작업: ${applicant.completed_jobs}건

## 지원 메시지
${sanitizeInput((applicant.application_message ?? "없음").slice(0, 300))}

## 평가 기준 (총 100점)
1. 직종 일치 (30점)
2. 기술 매칭 (25점)
3. 경력 적합도 (15점)
4. 평점/신뢰도 (15점)
5. 위치 근접성 (10점)
6. 급여 적합도 (5점)

## 등급: A(80+), B(60~79), C(40~59), D(0~39)

## JSON만 출력:
{
  "match_score": 87,
  "match_grade": "A",
  "summary": "50자 이내 한 문장 요약",
  "strengths": ["강점1", "강점2", "강점3"],
  "concerns": ["주의사항1"],
  "score_breakdown": {
    "specialty_match": { "score": 30, "max": 30, "detail": "설명" },
    "skills_match": { "score": 22, "max": 25, "detail": "설명" },
    "experience_fit": { "score": 15, "max": 15, "detail": "설명" },
    "rating_review": { "score": 13, "max": 15, "detail": "설명" },
    "location_match": { "score": 10, "max": 10, "detail": "설명" },
    "salary_fit": { "score": 3, "max": 5, "detail": "설명" }
  }
}`;

  return withAIRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return parseAIJsonResponse<AnalysisResult>(text);
  });
}

export async function analyzeAllApplicants(
  job: JobData,
  applicants: (ApplicantData & { application_id: string; worker_id: string })[]
): Promise<{ application_id: string; worker_id: string; result: AnalysisResult }[]> {
  const batchSize = 5;
  const results: { application_id: string; worker_id: string; result: AnalysisResult }[] = [];

  for (let i = 0; i < applicants.length; i += batchSize) {
    const batch = applicants.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (a) => {
        const result = await analyzeApplicant(job, a);
        return { application_id: a.application_id, worker_id: a.worker_id, result };
      })
    );
    for (const s of settled) {
      if (s.status === "fulfilled") results.push(s.value);
    }
  }

  return results;
}
