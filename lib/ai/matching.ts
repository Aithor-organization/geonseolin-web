import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });

export interface WorkerForMatching {
  id: string;
  name: string;
  specialty: string | null;
  experience: number;
  skills: string[];
  location: string | null;
  hourly_rate: number;
  rating: number;
  available: boolean;
  bio: string | null;
}

export interface JobForMatching {
  id: string;
  title: string;
  location: string | null;
  salary: string | null;
  type: string | null;
  description: string | null;
  requirements: string[];
}

export interface MatchResult {
  worker_id: string;
  worker_name: string;
  score: number;
  reasons: string[];
}

// 기술자 → 공고 매칭 (기술자에게 추천 공고 제공)
export async function matchJobsForWorker(
  worker: WorkerForMatching,
  jobs: JobForMatching[]
): Promise<{ job_id: string; score: number; reason: string }[]> {
  if (jobs.length === 0) return [];

  const prompt = `당신은 건설 인력 매칭 전문가입니다. 기술자의 프로필과 공고 목록을 비교해 적합도를 평가하세요.

## 기술자 정보
- 이름: ${worker.name}
- 전문분야: ${worker.specialty ?? "미지정"}
- 경력: ${worker.experience}년
- 보유 기술: ${worker.skills.join(", ") || "없음"}
- 위치: ${worker.location ?? "미지정"}
- 희망 시급: ${worker.hourly_rate.toLocaleString()}원
- 자기소개: ${worker.bio ?? "없음"}

## 공고 목록
${jobs.map((j, i) => `[${i}] "${j.title}" - 위치: ${j.location ?? "미지정"}, 급여: ${j.salary ?? "미지정"}, 유형: ${j.type ?? "미지정"}
  요구사항: ${j.requirements.join(", ") || "없음"}
  설명: ${(j.description ?? "").slice(0, 100)}`).join("\n")}

## 응답 규칙
- 각 공고에 0~100점 점수 부여
- 점수가 50점 이상인 공고만 포함
- 최대 5개까지만 추천 (가장 적합한 상위 5개)
- JSON 배열로 응답 (코드블록 없이 순수 JSON만)
- 형식: [{"index": 0, "score": 85, "reason": "한줄 사유"}]

점수 기준:
- 전문분야/기술 일치: 40점
- 위치 근접: 20점
- 급여 적합: 20점
- 경력 수준 매치: 20점`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const matches: { index: number; score: number; reason: string }[] = JSON.parse(jsonStr);

    return matches
      .filter((m) => m.index >= 0 && m.index < jobs.length && m.score >= 50)
      .sort((a, b) => b.score - a.score)
      .map((m) => ({
        job_id: jobs[m.index].id,
        score: m.score,
        reason: m.reason,
      }));
  } catch {
    return [];
  }
}

// 공고 → 기술자 매칭 (기업에게 추천 인력 제공)
export async function matchWorkersForJob(
  job: JobForMatching,
  workers: WorkerForMatching[]
): Promise<MatchResult[]> {
  if (workers.length === 0) return [];

  const prompt = `당신은 건설 인력 매칭 전문가입니다. 공고 요구사항과 기술자 목록을 비교해 적합도를 평가하세요.

## 공고 정보
- 제목: ${job.title}
- 위치: ${job.location ?? "미지정"}
- 급여: ${job.salary ?? "미지정"}
- 유형: ${job.type ?? "미지정"}
- 요구사항: ${job.requirements.join(", ") || "없음"}
- 설명: ${(job.description ?? "").slice(0, 200)}

## 기술자 목록
${workers.map((w, i) => `[${i}] ${w.name} - ${w.specialty ?? "미지정"}, 경력 ${w.experience}년, 기술: ${w.skills.join(", ") || "없음"}, 위치: ${w.location ?? "미지정"}, 시급: ${w.hourly_rate.toLocaleString()}원, 평점: ${w.rating}`).join("\n")}

## 응답 규칙
- 각 기술자에 0~100점 점수 부여
- 점수가 50점 이상인 기술자만 포함
- 최대 5개까지만 추천 (가장 적합한 상위 5명)
- JSON 배열로 응답 (코드블록 없이 순수 JSON만)
- 형식: [{"index": 0, "score": 85, "reasons": ["사유1", "사유2"]}]

점수 기준:
- 전문분야/기술 일치: 40점
- 위치 근접: 20점
- 급여 범위 적합: 20점
- 경력/평점: 20점`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const matches: { index: number; score: number; reasons: string[] }[] = JSON.parse(jsonStr);

    return matches
      .filter((m) => m.index >= 0 && m.index < workers.length && m.score >= 50)
      .sort((a, b) => b.score - a.score)
      .map((m) => ({
        worker_id: workers[m.index].id,
        worker_name: workers[m.index].name,
        score: m.score,
        reasons: m.reasons,
      }));
  } catch {
    return [];
  }
}
