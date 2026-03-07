# 건설人 AI 3대 기능 구현계획서

> **작성일**: 2026-03-07
> **프로젝트**: geonseolin-web (건설 인력 매칭 플랫폼)
> **스택**: Next.js 16 + Supabase + Gemini AI
> **기존 AI**: `lib/ai/matching.ts` (Gemini 3.0 Flash 매칭)

---

## 목차

1. [개요](#1-개요)
2. [기능 1: AI 자동 지원 시스템](#2-기능-1-ai-자동-지원-시스템)
3. [기능 2: AI 기업 챗봇](#3-기능-2-ai-기업-챗봇)
4. [기능 3: AI 지원자 분석 + 자동 확정](#4-기능-3-ai-지원자-분석--자동-확정)
5. [공통 인프라](#5-공통-인프라)
6. [데이터베이스 마이그레이션](#6-데이터베이스-마이그레이션)
7. [구현 로드맵](#7-구현-로드맵)
8. [테스트 전략](#8-테스트-전략)
9. [비용 및 수익 모델](#9-비용-및-수익-모델)
10. [전체 파일 목록](#10-전체-파일-목록)

---

## 1. 개요

### 1.1 배경

건설人 플랫폼에 AI를 통합하여 3가지 핵심 자동화 기능을 추가합니다.
기존 Gemini AI 매칭 시스템(`lib/ai/matching.ts`)을 확장하여 구현합니다.

### 1.2 3대 AI 기능 요약

| # | 기능 | 대상 | 핵심 가치 |
|---|------|------|----------|
| 1 | AI 자동 지원 | 기술자 | 프로필 기반 공고 자동 매칭 + 지원서 AI 작성 + 스케줄 지원 |
| 2 | AI 기업 챗봇 | 기업 | 기업별 맞춤 AI 봇으로 기술자 질문 자동 응대 |
| 3 | AI 지원자 분석 | 기업 | 지원자 적합도 스코어링 + 요약 + 확정 시 자동 메시지 |

### 1.3 현재 시스템 의존성

```
기존 시스템                  신규 AI 기능
─────────────              ─────────────
worker_profiles ─────────→ ① AI 자동 지원 (프로필 데이터 활용)
jobs + applications ─────→ ① AI 자동 지원 (공고 매칭 + 지원)
lib/ai/matching.ts ──────→ ① ③ (Gemini 프롬프트 패턴 재사용)
chat_rooms + messages ───→ ② AI 챗봇 (메시지 라우팅)
                         → ③ 확정 메시지 자동 전송
company_profiles ────────→ ② AI 챗봇 (기업 정보 컨텍스트)
applications + worker ───→ ③ AI 지원자 분석 (스코어링)
contracts ───────────────→ ③ 확정 후 계약 초안 연동
```

### 1.4 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| AI 모델 | Gemini 3.0 Flash | 기존 매칭에서 이미 사용 중, 비용 효율적 |
| 스케줄러 | Vercel Cron | Next.js와 동일 인프라, 설정 간단 |
| 메시지 라우팅 | Next.js API Route (트리거 기반) | Supabase DB Trigger → API 호출 |
| 캐싱 | Supabase 테이블 (applicant_analysis) | 분석 결과 영구 저장 + 재사용 |

---

## 2. 기능 1: AI 자동 지원 시스템

### 2.1 기능 정의

기술자의 프로필 정보를 기반으로 AI가 자동으로:
1. 매칭되는 공고를 검색
2. 공고에 맞춘 지원서를 작성
3. 설정된 시간에 자동으로 지원 제출

### 2.2 사용자 플로우

```
[기술자 설정 페이지]
    │
    ├── 자동 지원 ON/OFF 토글
    ├── 일일 최대 지원 수 (1~10개, 기본 3개)
    ├── 자동 지원 시간 설정 (기본 09:00)
    ├── 선호 조건 필터
    │   ├── 지역 (복수 선택)
    │   ├── 최소 일당
    │   ├── 공고 유형 (일용직/단기/장기)
    │   └── 제외 키워드
    ├── 지원서 템플릿 (선택)
    │   ├── 사용 안 함 (AI 자동 생성)
    │   ├── 템플릿 1: [사용자 작성]
    │   └── 템플릿 2: [사용자 작성]
    └── 저장

[자동 지원 프로세스] (Vercel Cron, 매 15분)
    │
    ├── 1. 활성화된 사용자 중 현재 시간 매칭 사용자 조회
    ├── 2. 각 사용자별 매칭 공고 검색
    │   └── 기존 matchJobsForWorker() 로직 재사용
    ├── 3. 이미 지원한 공고 제외
    ├── 4. AI 지원서 생성 (Gemini)
    │   ├── 템플릿 있으면 → 템플릿 + 공고 맞춤 수정
    │   └── 템플릿 없으면 → 프로필 기반 완전 자동 생성
    ├── 5. 지원 제출 (applications INSERT)
    └── 6. 로그 기록 (auto_apply_logs INSERT)

[기술자 대시보드]
    │
    ├── "오늘 AI가 N건 지원했습니다" 알림 배너
    └── AI 지원 내역 목록 (점수, 지원서, 상태)
```

### 2.3 데이터베이스 스키마

#### 테이블: `auto_apply_settings`

```sql
CREATE TABLE public.auto_apply_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,

  -- 기본 설정
  enabled BOOLEAN NOT NULL DEFAULT false,
  max_daily_applications INTEGER NOT NULL DEFAULT 3
    CHECK (max_daily_applications BETWEEN 1 AND 10),
  apply_time TIME NOT NULL DEFAULT '09:00:00',

  -- 필터 조건
  preferred_locations TEXT[] DEFAULT '{}',
  min_daily_rate INTEGER DEFAULT 0,
  job_types TEXT[] DEFAULT '{}',
  exclude_keywords TEXT[] DEFAULT '{}',

  -- 지원서 템플릿
  templates JSONB DEFAULT '[]',
  -- 형식: [{ "id": "uuid", "name": "기본 템플릿", "content": "..." }]
  active_template_id TEXT,  -- null이면 AI 자동 생성

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(worker_id)
);

ALTER TABLE public.auto_apply_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인만 조회/수정" ON public.auto_apply_settings
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());
```

#### 테이블: `auto_apply_logs`

```sql
CREATE TABLE public.auto_apply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,

  -- AI 분석 결과
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_reasons JSONB DEFAULT '[]',
  generated_message TEXT NOT NULL,

  -- 상태
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'skipped', 'failed')),
  skip_reason TEXT,
  error_message TEXT,

  executed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(worker_id, job_id)
);

ALTER TABLE public.auto_apply_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인만 조회" ON public.auto_apply_logs
  FOR SELECT USING (worker_id = auth.uid());

CREATE INDEX idx_auto_apply_logs_worker
  ON public.auto_apply_logs(worker_id, executed_at DESC);
```

#### 테이블 수정: `applications`

```sql
ALTER TABLE public.applications
  ADD COLUMN is_auto_applied BOOLEAN DEFAULT false,
  ADD COLUMN auto_apply_log_id UUID REFERENCES public.auto_apply_logs(id)
    ON DELETE SET NULL;
```

### 2.4 API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/auto-apply/settings` | worker | 설정 조회 |
| PUT | `/api/auto-apply/settings` | worker | 설정 저장 |
| GET | `/api/auto-apply/logs` | worker | 로그 목록 + 통계 |
| POST | `/api/auto-apply/execute` | service_role 또는 worker | 자동 지원 실행 |
| POST | `/api/auto-apply/preview` | worker | 특정 공고 지원서 미리보기 |
| POST | `/api/auto-apply/cron` | CRON_SECRET | Vercel Cron 엔드포인트 |

#### `PUT /api/auto-apply/settings` 요청 바디

```typescript
{
  enabled: boolean;
  max_daily_applications: number;     // 1~10
  apply_time: string;                 // "HH:MM"
  preferred_locations: string[];
  min_daily_rate: number;
  job_types: string[];
  exclude_keywords: string[];
  templates: {
    id: string;
    name: string;
    content: string;                  // 20~1000자
  }[];
  active_template_id: string | null;
}
```

#### `POST /api/auto-apply/execute` 동작 순서

```
1. 프로필 완성도 100% 확인 (기존 profile-completeness.ts)
2. 오늘 지원 횟수 확인 (max_daily_applications 초과 시 중단)
3. 매칭 공고 검색
   - 기존 matchJobsForWorker() 호출
   - preferred_locations, min_daily_rate, job_types 필터 적용
   - exclude_keywords 포함 공고 제외
4. 이미 지원한 공고 제외 (applications 테이블 조회)
5. 매칭 점수 50점 이상만 대상
6. 각 공고별 AI 지원서 생성 (Gemini)
   - 템플릿 있으면 → 템플릿 구조 + 공고 맞춤
   - 템플릿 없으면 → 프로필 기반 완전 자동 생성
7. applications 테이블에 INSERT (is_auto_applied = true)
8. auto_apply_logs 테이블에 결과 기록
9. 결과 요약 반환
```

#### `POST /api/auto-apply/cron` Vercel Cron 설정

```json
// vercel.json
{
  "crons": [{
    "path": "/api/auto-apply/cron",
    "schedule": "*/15 * * * *"
  }]
}
```

```typescript
// app/api/auto-apply/cron/route.ts
export async function POST(req: NextRequest) {
  // CRON_SECRET 인증
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 현재 시간에 해당하는 활성 사용자 조회
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

  // apply_time이 현재 15분 window 내인 사용자 조회
  // 각 사용자별 /api/auto-apply/execute 호출
}
```

### 2.5 AI 프롬프트

```typescript
// lib/ai/auto-apply.ts

export const GENERATE_APPLICATION_PROMPT = `
당신은 건설 인력 매칭 플랫폼 '건설人'의 AI 지원서 작성 도우미입니다.

## 기술자 프로필
- 이름: {worker_name}
- 전문 분야: {specialty}
- 경력: {experience}년
- 보유 기술: {skills}
- 자기소개: {bio}
- 평점: {rating}/5 ({review_count}명 평가)
- 완료 작업: {completed_jobs}건

## 공고 정보
- 공고명: {job_title}
- 위치: {job_location}
- 급여: {job_salary}
- 유형: {job_type}
- 설명: {job_description}
- 요구사항: {job_requirements}

## 지원서 템플릿 (있는 경우)
{template_content}

## 작성 규칙
1. 200~500자로 작성
2. 공고 요구사항에 맞는 경력/기술을 구체적으로 언급
3. 전문적이되 자연스러운 어투 사용
4. 거짓 정보 절대 포함 금지 (프로필 정보만 사용)
5. 템플릿이 있으면 구조를 따르되 공고에 맞게 커스터마이즈

## JSON만 출력:
{
  "message": "지원서 본문",
  "match_score": 0~100,
  "match_reasons": ["이유1", "이유2", "이유3"]
}
`;
```

### 2.6 프론트엔드 변경

#### 신규 파일

| 파일 | 설명 |
|------|------|
| `app/settings/auto-apply/page.tsx` | 자동 지원 설정 페이지 |
| `lib/hooks/use-auto-apply.ts` | 자동 지원 설정/로그 훅 |
| `components/features/AutoApplyLogCard.tsx` | 자동 지원 로그 카드 컴포넌트 |
| `components/features/AutoApplyStats.tsx` | 자동 지원 통계 위젯 |
| `lib/ai/auto-apply.ts` | AI 지원서 생성 로직 |
| `app/api/auto-apply/settings/route.ts` | 설정 API |
| `app/api/auto-apply/logs/route.ts` | 로그 API |
| `app/api/auto-apply/execute/route.ts` | 실행 API |
| `app/api/auto-apply/preview/route.ts` | 미리보기 API |
| `app/api/auto-apply/cron/route.ts` | 크론 API |

#### 기존 파일 수정

| 파일 | 변경 내용 |
|------|----------|
| `app/settings/page.tsx` | "AI 자동 지원" 섹션 + 링크 추가 (worker 전용) |
| `app/dashboard/worker/page.tsx` | "오늘 AI 지원 N건" 알림 배너 추가 |
| `app/applications/page.tsx` | `is_auto_applied` 시 🤖 배지 표시 |
| `lib/validations.ts` | `autoApplySettingsSchema` 추가 |

#### 설정 페이지 UI

```
┌──────────────────────────────────────┐
│ ← 뒤로    AI 자동 지원 설정            │
├──────────────────────────────────────┤
│                                      │
│ [자동 지원 활성화        ━━━━━● ON]  │
│                                      │
│ ┌──── 📋 기본 설정 ────────────────┐ │
│ │ 일일 최대 지원 수                 │ │
│ │ [ 1 ] [ 2 ] [●3●] [ 5 ] [ 10 ] │ │
│ │                                  │ │
│ │ 자동 지원 시간                    │ │
│ │ [ 09:00 ▼ ]                     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──── 🎯 선호 조건 ────────────────┐ │
│ │ 선호 지역                        │ │
│ │ [서울] [경기] [+추가]             │ │
│ │                                  │ │
│ │ 최소 일당                        │ │
│ │ [     150,000원     ]           │ │
│ │                                  │ │
│ │ 공고 유형                        │ │
│ │ [✓일용직] [✓단기] [□장기]        │ │
│ │                                  │ │
│ │ 제외 키워드                      │ │
│ │ [야간] [×] [위험작업] [×]        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──── 📝 지원서 설정 ──────────────┐ │
│ │ ○ AI 자동 생성 (추천)            │ │
│ │ ● 템플릿 사용                    │ │
│ │ ┌────────────────────────────┐  │ │
│ │ │ 기본 템플릿                 │  │ │
│ │ │ "안녕하세요. {경력}년..."   │  │ │
│ │ │ [수정] [삭제]               │  │ │
│ │ └────────────────────────────┘  │ │
│ │ [+ 새 템플릿 추가]              │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [         설정 저장         ]        │
│                                      │
│ ┌──── 📊 최근 자동 지원 내역 ──────┐ │
│ │ 3/7 배관공 모집 (87점) ✅ 지원됨  │ │
│ │ 3/7 설비 기사 (72점) ✅ 지원됨   │ │
│ │ 3/7 용접공 (45점) ⏭️ 건너뜀     │ │
│ │ [전체 내역 보기 →]               │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 2.7 Zod 검증 스키마

```typescript
// lib/validations.ts에 추가

export const autoApplySettingsSchema = z.object({
  enabled: z.boolean(),
  max_daily_applications: z.number().int().min(1).max(10).default(3),
  apply_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM 형식"),
  preferred_locations: z.array(z.string()).default([]),
  min_daily_rate: z.number().int().min(0).default(0),
  job_types: z.array(z.string()).default([]),
  exclude_keywords: z.array(z.string()).default([]),
  templates: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    content: z.string().min(20).max(1000),
  })).max(5).default([]),
  active_template_id: z.string().uuid().nullable().default(null),
});
```

---

## 3. 기능 2: AI 기업 챗봇

### 3.1 기능 정의

각 기업에 맞춤형 AI 챗봇을 제공하여:
1. 기술자의 채팅 질문을 자동으로 응대
2. 기업 정보 + 공고 정보 + FAQ를 기반으로 답변 생성
3. AI가 답변 불가능한 질문은 담당자에게 자동 전달 (에스컬레이션)

### 3.2 사용자 플로우

```
[기업 설정: AI 챗봇 관리]
    │
    ├── 챗봇 ON/OFF 토글
    ├── 응대 시간 설정
    │   ├── 항상 (24시간)
    │   ├── 업무 외 시간만 (18:00~09:00)
    │   └── 사용자 지정
    ├── FAQ 관리
    │   ├── [+ FAQ 추가] (질문 + 답변)
    │   ├── 기존 FAQ 수정/삭제
    │   └── 카테고리 분류
    ├── 답변 톤 설정
    │   ├── 격식체 ("~입니다")
    │   ├── 친근한 ("~해요")
    │   └── 간결한 (핵심만)
    └── 에스컬레이션 키워드 설정
        └── 예: "급여", "계약", "불만", "사고"

[메시지 라우팅 - 기술자→기업 채팅 시]
    │
    ├── 1. 기술자가 메시지 전송
    ├── 2. messages 테이블 INSERT 후 트리거 실행
    ├── 3. 수신자(기업)의 챗봇 설정 확인
    │   ├── 챗봇 OFF → 일반 메시지 (아무 처리 안 함)
    │   ├── 챗봇 ON + 응대 시간 아님 → 일반 메시지
    │   └── 챗봇 ON + 응대 시간 내 → AI 처리 진행
    ├── 4. 에스컬레이션 키워드 체크
    │   └── 매칭 시 → "담당자에게 전달하겠습니다" + 플래그
    ├── 5. AI 컨텍스트 구성
    │   ├── company_profiles (기업 정보)
    │   ├── jobs (활성 공고)
    │   ├── company_bot_faq (FAQ)
    │   └── 최근 대화 10개 (히스토리)
    ├── 6. Gemini로 답변 생성
    └── 7. messages INSERT (is_ai_response = true)
```

### 3.3 데이터베이스 스키마

#### 테이블: `company_bot_settings`

```sql
CREATE TABLE public.company_bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,

  enabled BOOLEAN NOT NULL DEFAULT false,

  -- 응대 시간
  schedule_mode TEXT NOT NULL DEFAULT 'always'
    CHECK (schedule_mode IN ('always', 'off_hours', 'custom')),
  custom_start_time TIME,
  custom_end_time TIME,

  -- 답변 스타일
  tone TEXT NOT NULL DEFAULT 'polite'
    CHECK (tone IN ('formal', 'polite', 'concise')),

  -- 에스컬레이션
  escalation_keywords TEXT[] DEFAULT ARRAY[
    '급여', '계약', '불만', '사고', '보험'
  ],
  notify_on_escalation BOOLEAN DEFAULT true,

  -- 통계
  total_responses INTEGER DEFAULT 0,
  total_escalations INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id)
);

ALTER TABLE public.company_bot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 기업만" ON public.company_bot_settings
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());
```

#### 테이블: `company_bot_faq`

```sql
CREATE TABLE public.company_bot_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,

  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,               -- '근무환경', '급여', '복리후생' 등
  priority INTEGER DEFAULT 0,  -- 높을수록 우선 매칭
  use_count INTEGER DEFAULT 0, -- AI가 참조한 횟수

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_bot_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 기업만" ON public.company_bot_faq
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

CREATE INDEX idx_bot_faq_company
  ON public.company_bot_faq(company_id, priority DESC);
```

#### 테이블 수정: `messages`

```sql
ALTER TABLE public.messages
  ADD COLUMN is_ai_response BOOLEAN DEFAULT false,
  ADD COLUMN ai_confidence NUMERIC(3,2),   -- 0.00~1.00
  ADD COLUMN escalated BOOLEAN DEFAULT false;
```

### 3.4 API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/company-bot/settings` | company | 챗봇 설정 조회 |
| PUT | `/api/company-bot/settings` | company | 챗봇 설정 저장 |
| GET | `/api/company-bot/faq` | company | FAQ 목록 조회 |
| POST | `/api/company-bot/faq` | company | FAQ 추가 |
| PUT | `/api/company-bot/faq/[id]` | company | FAQ 수정 |
| DELETE | `/api/company-bot/faq/[id]` | company | FAQ 삭제 |
| POST | `/api/company-bot/respond` | service_role | AI 응답 생성 (내부용) |
| GET | `/api/company-bot/stats` | company | 챗봇 통계 |

#### `POST /api/company-bot/respond` 동작 순서

```
입력: { room_id, message_id, sender_id, company_id }

1. sender가 기술자(worker)인지 확인
   → company가 보낸 메시지는 무시
2. company의 챗봇 설정 조회
   → enabled = false면 종료
3. 응대 시간 확인
   → 'always': 항상 처리
   → 'off_hours': 09:00~18:00이면 종료
   → 'custom': custom_start_time~custom_end_time이면 처리
4. 에스컬레이션 키워드 체크
   → 매칭 시: "담당자에게 전달하겠습니다" 메시지 INSERT
   → escalated = true 설정
   → total_escalations++
   → 종료
5. AI 컨텍스트 구성:
   a. company_profiles → 기업 정보
   b. jobs (status='active', company_id) → 활성 공고
   c. company_bot_faq (company_id) → FAQ
   d. messages (room_id, 최근 10개) → 대화 히스토리
6. Gemini 호출 (CHATBOT_RESPONSE_PROMPT)
7. 응답 파싱:
   → confidence >= 0.5: 응답 메시지 INSERT
   → confidence < 0.5: "담당자에게 확인 후 안내드리겠습니다" INSERT
8. total_responses++
9. matched_faq_id 있으면 해당 FAQ use_count++
```

### 3.5 메시지 라우팅 구현

**Option A: Supabase Database Trigger (권장)**

```sql
CREATE OR REPLACE FUNCTION notify_chatbot_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_other_user UUID;
  v_other_role TEXT;
  v_bot_enabled BOOLEAN;
BEGIN
  -- 채팅방의 상대방 확인
  SELECT user_id INTO v_other_user
  FROM chat_participants
  WHERE room_id = NEW.room_id AND user_id != NEW.sender_id
  LIMIT 1;

  IF v_other_user IS NULL THEN RETURN NEW; END IF;

  -- 상대방 역할 확인
  SELECT role INTO v_other_role FROM profiles WHERE id = v_other_user;
  IF v_other_role != 'company' THEN RETURN NEW; END IF;

  -- 챗봇 활성 확인
  SELECT enabled INTO v_bot_enabled
  FROM company_bot_settings WHERE company_id = v_other_user;

  IF v_bot_enabled = true THEN
    -- pg_net으로 API 호출 (비동기)
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/company-bot-respond',
      body := json_build_object(
        'room_id', NEW.room_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'company_id', v_other_user
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_chatbot_on_message();
```

**Option B: Supabase Realtime 구독 (대안)**

```typescript
// Edge Function에서 messages 테이블 구독
// INSERT 이벤트 감지 → /api/company-bot/respond 호출
```

### 3.6 AI 프롬프트

```typescript
// lib/ai/company-bot.ts

export const CHATBOT_RESPONSE_PROMPT = `
당신은 건설 기업 "{company_name}"의 AI 상담 도우미입니다.
기술자의 질문에 기업 정보를 기반으로 정확하게 답변하세요.

## 기업 정보
- 회사명: {company_name}
- 업종: {industry}
- 규모: {employees}
- 주소: {address}
- 소개: {description}

## 현재 진행 중인 공고
{active_jobs_json}

## FAQ (우선 참조)
{faq_list}

## 최근 대화 히스토리
{recent_messages}

## 답변 스타일: {tone}
- formal: "~입니다", "~하시기 바랍니다"
- polite: "~해요", "~드려요"
- concise: 핵심만 간결하게

## 답변 규칙
1. FAQ에 일치하는 질문이 있으면 FAQ 답변을 우선 사용
2. 기업 정보/공고에서 확인 가능한 내용만 답변
3. 확인 불가능한 내용은 "담당자에게 확인 후 안내드리겠습니다"로 응대
4. 급여 협상, 계약 조건 등 민감한 주제는 에스컬레이션
5. 짧고 명확하게 답변 (최대 300자)

## JSON만 출력:
{
  "response": "답변 내용",
  "confidence": 0.0~1.0,
  "should_escalate": false,
  "escalation_reason": null,
  "matched_faq_id": null
}
`;
```

### 3.7 프론트엔드 변경

#### 신규 파일

| 파일 | 설명 |
|------|------|
| `app/settings/company-bot/page.tsx` | 챗봇 설정 페이지 |
| `app/settings/company-bot/faq/page.tsx` | FAQ 관리 페이지 |
| `lib/hooks/use-company-bot.ts` | 챗봇 설정/FAQ 훅 |
| `lib/ai/company-bot.ts` | AI 응답 생성 로직 |
| `components/features/AiBadge.tsx` | AI 응답 배지 컴포넌트 |
| `app/api/company-bot/settings/route.ts` | 설정 API |
| `app/api/company-bot/faq/route.ts` | FAQ API |
| `app/api/company-bot/faq/[id]/route.ts` | FAQ 개별 API |
| `app/api/company-bot/respond/route.ts` | AI 응답 API |
| `app/api/company-bot/stats/route.ts` | 통계 API |

#### 기존 파일 수정

| 파일 | 변경 내용 |
|------|----------|
| `app/settings/page.tsx` | "AI 챗봇 관리" 섹션 추가 (company 전용) |
| `components/features/ChatBubble.tsx` | `is_ai_response` 시 🤖 배지 + 안내 문구 |
| `app/chat/page.tsx` | AI 응답 메시지 스타일 구분 (옅은 보라색 배경) |
| `lib/hooks/use-chat.ts` | 메시지 타입에 `is_ai_response`, `escalated` 필드 추가 |
| `lib/validations.ts` | `companyBotSettingsSchema`, `botFaqSchema` 추가 |

#### ChatBubble 변경사항

```
기존:
┌──────────────────┐
│ 메시지 내용       │
│          14:30   │
└──────────────────┘

AI 응답:
┌──────────────────┐
│ 🤖 AI 자동 응답   │
│ 메시지 내용       │
│          14:30   │
│ ─────────────── │
│ AI가 자동 응답    │
│ 했습니다          │
└──────────────────┘
→ 옅은 보라색 배경
→ 하단 안내: "AI가 자동 응답했습니다"
```

### 3.8 Zod 검증 스키마

```typescript
export const companyBotSettingsSchema = z.object({
  enabled: z.boolean(),
  schedule_mode: z.enum(['always', 'off_hours', 'custom']),
  custom_start_time: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  custom_end_time: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  tone: z.enum(['formal', 'polite', 'concise']).default('polite'),
  escalation_keywords: z.array(z.string()).default([]),
  notify_on_escalation: z.boolean().default(true),
});

export const botFaqSchema = z.object({
  question: z.string().min(5).max(200),
  answer: z.string().min(5).max(500),
  category: z.string().max(20).optional(),
});
```

---

## 4. 기능 3: AI 지원자 분석 + 자동 확정

### 4.1 기능 정의

기업이 공고에 지원한 기술자를 AI로 분석하여:
1. 공고 요구사항 대비 적합도 스코어링 (0~100점, A~D 등급)
2. 각 지원자별 AI 요약 + 강점/주의사항
3. 확정 시 자동 채팅방 생성 + 확정 메시지 전송
4. 거절 시 자동 안내 메시지 전송
5. (선택) 일괄 거절 + 계약 초안 자동 생성

### 4.2 사용자 플로우

```
[기업: 공고 상세 → 지원자 관리 페이지]
    │
    ├── [🤖 AI 분석 실행] 버튼
    │   └── 전체 지원자 일괄 분석 (applicant_analysis 저장)
    │
    ├── 지원자 목록 (AI 분석 결과 포함)
    │   ├── ⭐ 87점 A등급 - 김철수
    │   │   ├── AI 요약 / 강점 / 주의사항
    │   │   ├── 항목별 점수 시각화 바
    │   │   └── [✅ 확정] [❌ 거절]
    │   ├── ⭐ 73점 B등급 - 이영희
    │   └── ⭐ 45점 D등급 - 박민수
    │
    ├── 정렬: AI점수순 | 지원일순 | 경력순 | 평점순
    │
    └── [✅ 확정] 클릭 시 다이얼로그
        ├── ☑ 나머지 지원자 자동 거절
        ├── ☑ 계약서 초안 자동 생성
        │   ├── 일당: [입력]
        │   ├── 근무일수: [입력]
        │   ├── 시작일: [입력]
        │   └── 종료일: [입력]
        └── [확정하기]
```

### 4.3 데이터베이스 스키마

#### 테이블: `applicant_analysis`

```sql
CREATE TABLE public.applicant_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,

  -- AI 분석 결과
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  match_grade TEXT NOT NULL CHECK (match_grade IN ('A', 'B', 'C', 'D')),
  summary TEXT NOT NULL,

  -- 상세 분석
  strengths JSONB NOT NULL DEFAULT '[]',
  concerns JSONB NOT NULL DEFAULT '[]',
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "specialty_match": { "score": 30, "max": 30, "detail": "배관→배관 일치" },
  --   "skills_match": { "score": 22, "max": 25, "detail": "3/4 기술 일치" },
  --   "experience_fit": { "score": 15, "max": 15, "detail": "8년 (요구 5년+)" },
  --   "rating_review": { "score": 13, "max": 15, "detail": "4.7/5 (23명)" },
  --   "location_match": { "score": 10, "max": 10, "detail": "서울→서울 일치" },
  --   "salary_fit": { "score": 3, "max": 5, "detail": "28,000원 (예산 25,000원)" }
  -- }

  model_version TEXT DEFAULT 'v1',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(application_id)
);

ALTER TABLE public.applicant_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공고 소유 기업만 조회" ON public.applicant_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applicant_analysis.job_id
      AND jobs.company_id = auth.uid()
    )
  );

CREATE INDEX idx_analysis_job
  ON public.applicant_analysis(job_id, match_score DESC);
```

#### 테이블: `notification_templates`

```sql
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE CHECK (type IN (
    'application_accepted',
    'application_rejected',
    'contract_created',
    'review_requested',
    'auto_apply_result'
  )),
  template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시드 데이터
INSERT INTO notification_templates (type, template, variables) VALUES
  ('application_accepted',
   '🎉 [{job_title}]에 확정되셨습니다!\n{company_name}에서 회원님을 선택했습니다.\n담당자에게 메시지를 보내보세요.',
   ARRAY['job_title', 'company_name']),
  ('application_rejected',
   '안타깝지만 [{job_title}] 지원이 마감되었습니다.\n다른 공고도 확인해보세요!',
   ARRAY['job_title', 'company_name']),
  ('auto_apply_result',
   '🤖 AI가 오늘 {count}건의 공고에 지원했습니다.\n지원 내역을 확인해보세요.',
   ARRAY['count']);
```

### 4.4 API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/jobs/[id]/applicants/analyze` | company (본인 공고) | 전체 지원자 AI 분석 |
| GET | `/api/jobs/[id]/applicants` | company (본인 공고) | 지원자 목록 + AI 분석 (수정) |
| POST | `/api/jobs/[id]/applicants/[appId]/confirm` | company (본인 공고) | 확정/거절 + 자동화 |

#### `POST /api/jobs/[id]/applicants/analyze` 동작 순서

```
1. 공고 소유권 확인 (jobs.company_id = auth.uid())
2. 해당 공고의 모든 지원자 조회:
   SELECT a.*, wp.*, p.name
   FROM applications a
   JOIN worker_profiles wp ON wp.id = a.worker_id
   JOIN profiles p ON p.id = a.worker_id
   WHERE a.job_id = {id}
3. 공고 상세 정보 조회 (title, description, requirements, salary, location)
4. 각 지원자별 AI 분석 실행 (Gemini)
   - 병렬 처리: Promise.allSettled() (최대 5개 동시)
5. applicant_analysis 테이블에 UPSERT
   (기존 분석 있으면 갱신, 없으면 생성)
6. 결과 반환: { analyses: [...], total, analyzed_at }
```

#### `GET /api/jobs/[id]/applicants` 수정사항

```sql
-- 기존 쿼리에 LEFT JOIN 추가
SELECT
  a.*,
  p.name, p.avatar_url,
  wp.specialty, wp.experience, wp.skills, wp.rating, wp.review_count,
  wp.completed_jobs, wp.hourly_rate, wp.location,
  aa.match_score, aa.match_grade, aa.summary,
  aa.strengths, aa.concerns, aa.score_breakdown
FROM applications a
JOIN profiles p ON p.id = a.worker_id
JOIN worker_profiles wp ON wp.id = a.worker_id
LEFT JOIN applicant_analysis aa ON aa.application_id = a.id
WHERE a.job_id = {id}
ORDER BY
  CASE WHEN {sort} = 'match_score' THEN aa.match_score END DESC NULLS LAST,
  CASE WHEN {sort} = 'created_at' THEN a.created_at END DESC,
  CASE WHEN {sort} = 'experience' THEN wp.experience END DESC,
  CASE WHEN {sort} = 'rating' THEN wp.rating END DESC
```

#### `POST /api/jobs/[id]/applicants/[appId]/confirm` 동작 순서

```
요청: {
  action: 'accept' | 'reject',
  auto_reject_others: boolean,
  create_contract_draft: boolean,
  contract_data?: { daily_rate, work_days, start_date, end_date }
}

[action = 'accept']
1. applications.status = 'accepted'
2. 채팅방 확인/생성:
   - chat_rooms에서 기업+기술자 1:1 방 검색
   - 없으면 새로 생성 (기존 POST /api/chat/rooms 로직 재사용)
3. 확정 메시지 전송:
   - notification_templates에서 'application_accepted' 조회
   - 변수 치환: {job_title}, {company_name}
   - messages INSERT (sender_id = company_id)
4. auto_reject_others = true 시:
   - 같은 공고의 다른 pending 지원 전부 → 'rejected'
   - 각 지원자에게 거절 메시지 전송 (채팅방 생성 + 메시지)
5. create_contract_draft = true 시:
   - contracts INSERT (status = 'pending')
   - contract_data 필드 저장

[action = 'reject']
1. applications.status = 'rejected'
2. 채팅방 확인/생성
3. 거절 메시지 전송 (notification_templates 'application_rejected')
```

### 4.5 스코어링 기준

| 항목 | 배점 | 산출 방식 |
|------|------|----------|
| 직종 일치 | 30점 | specialty === job 분야 → 30점, 유사 분야 → 15점, 불일치 → 0점 |
| 기술 매칭 | 25점 | (일치 기술 수 / 요구 기술 수) × 25 |
| 경력 적합도 | 15점 | 요구 충족 → 15점, 80%+ → 10점, 50%+ → 5점, 미달 → 0점 |
| 평점/신뢰도 | 15점 | rating×2 + min(review_count, 10)×0.5 |
| 위치 근접성 | 10점 | 동일 시/도 → 10점, 인접 → 5점, 기타 → 0점 |
| 급여 적합도 | 5점 | 예산 이하 → 5점, 10% 초과 → 3점, 20%+ → 0점 |

| 등급 | 점수 범위 | 의미 |
|------|----------|------|
| A | 80~100점 | 매우 적합 |
| B | 60~79점 | 적합 |
| C | 40~59점 | 보통 |
| D | 0~39점 | 부적합 |

### 4.6 AI 프롬프트

```typescript
// lib/ai/applicant-analysis.ts

export const ANALYZE_APPLICANT_PROMPT = `
당신은 건설 인력 매칭 플랫폼 '건설人'의 AI 지원자 분석 전문가입니다.
공고 요구사항과 지원자 프로필을 비교하여 적합도를 평가하세요.

## 공고 정보
- 공고명: {job_title}
- 위치: {job_location}
- 급여: {job_salary}
- 유형: {job_type}
- 설명: {job_description}
- 요구사항: {job_requirements}
- 복리후생: {job_benefits}

## 지원자 프로필
- 이름: {worker_name}
- 전문 분야: {specialty}
- 경력: {experience}년
- 보유 기술: {skills}
- 자기소개: {bio}
- 지역: {location}
- 시급: {hourly_rate}원
- 평점: {rating}/5 ({review_count}명)
- 완료 작업: {completed_jobs}건

## 지원 메시지
{application_message}

## 평가 기준 (총 100점)
1. 직종 일치 (30점): specialty가 공고와 일치/유사한지
2. 기술 매칭 (25점): requirements와 skills 교집합 비율
3. 경력 적합도 (15점): 공고 요구 대비 경력 충분한지
4. 평점/신뢰도 (15점): rating + review_count + completed_jobs
5. 위치 근접성 (10점): 지원자 위치와 공고 위치 근접도
6. 급여 적합도 (5점): 시급/일당이 예산 범위 내인지

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
}
`;
```

### 4.7 프론트엔드 변경

#### 신규 파일

| 파일 | 설명 |
|------|------|
| `components/features/ApplicantAnalysisCard.tsx` | AI 분석 결과 카드 |
| `components/features/ScoreBreakdown.tsx` | 항목별 점수 바 시각화 |
| `components/features/ConfirmDialog.tsx` | 확정/거절 다이얼로그 |
| `lib/hooks/use-applicant-analysis.ts` | AI 분석 데이터 훅 |
| `lib/ai/applicant-analysis.ts` | AI 분석 로직 |
| `app/api/jobs/[id]/applicants/analyze/route.ts` | 분석 API |
| `app/api/jobs/[id]/applicants/[appId]/confirm/route.ts` | 확정 API |

#### 기존 파일 수정

| 파일 | 변경 내용 |
|------|----------|
| `app/jobs/[id]/applicants/page.tsx` | AI 분석 버튼, 분석 카드, 정렬, 확정/거절 |
| `app/api/jobs/[id]/applicants/route.ts` | applicant_analysis LEFT JOIN |
| `lib/validations.ts` | `confirmApplicationSchema` 추가 |

#### 지원자 관리 페이지 UI

```
┌───────────────────────────────────────────┐
│ ← 뒤로    배관공 모집 - 지원자 관리         │
├───────────────────────────────────────────┤
│                                           │
│ 지원자 5명  [🤖 AI 분석 실행]              │
│ 정렬: [AI점수순 ▼]                         │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ ⭐ 87점  [ A등급 ]                   │   │
│ │                                     │   │
│ │ 👷 김철수  배관 전문 · 경력 8년      │   │
│ │ ★★★★★ 4.7 (23명) · 완료 15건       │   │
│ │                                     │   │
│ │ 📝 AI 요약                          │   │
│ │ "8년 경력 배관 전문가, 용접 기술     │   │
│ │  보유. 높은 평점과 다수 완료 이력으로 │   │
│ │  신뢰도 높음."                      │   │
│ │                                     │   │
│ │ ✅ 강점                             │   │
│ │ • 직종 일치 (배관 → 배관)            │   │
│ │ • 용접 기술 보유                     │   │
│ │ • 평점 4.7 (상위 15%)               │   │
│ │                                     │   │
│ │ ⚠️ 참고                             │   │
│ │ • 시급 28,000원 (예산 대비 +12%)     │   │
│ │                                     │   │
│ │ 직종 ████████████████████ 30/30     │   │
│ │ 기술 ████████████████░░░░ 22/25     │   │
│ │ 경력 ████████████████████ 15/15     │   │
│ │ 평점 █████████████████░░░ 13/15     │   │
│ │ 위치 ████████████████████ 10/10     │   │
│ │ 급여 ████████████░░░░░░░░ 03/05     │   │
│ │                                     │   │
│ │   [ ✅ 확정하기 ]  [ ❌ 거절 ]       │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ ⭐ 73점  [ B등급 ]                   │   │
│ │ 👷 이영희  배관 전문 · 경력 3년      │   │
│ │ (접힌 상태 - 클릭 시 펼침)           │   │
│ └─────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

#### 확정 다이얼로그

```
┌──────────────────────────────────┐
│     김철수님을 확정할까요?         │
│                                  │
│ ☑ 나머지 지원자 자동 거절          │
│   (거절 안내 메시지 자동 발송)      │
│                                  │
│ ☑ 계약서 초안 자동 생성            │
│   일당:     [    250,000원   ]   │
│   근무일수: [      30일      ]   │
│   시작일:   [  2026-03-15    ]   │
│   종료일:   [  2026-04-15    ]   │
│                                  │
│  [ 취소 ]         [ 확정하기 ]    │
└──────────────────────────────────┘
```

### 4.8 Zod 검증 스키마

```typescript
export const confirmApplicationSchema = z.object({
  action: z.enum(['accept', 'reject']),
  auto_reject_others: z.boolean().default(false),
  create_contract_draft: z.boolean().default(false),
  contract_data: z.object({
    daily_rate: z.number().int().positive(),
    work_days: z.number().int().positive(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }).optional(),
});
```

---

## 5. 공통 인프라

### 5.1 AI 모듈 구조

```
lib/ai/
├── matching.ts              # 기존 매칭 (최소한의 수정)
├── shared.ts                # 공통: Gemini 클라이언트, sanitize, JSON 파싱
├── auto-apply.ts            # 기능 1: AI 자동 지원서 생성
├── company-bot.ts           # 기능 2: AI 챗봇 응답 생성
└── applicant-analysis.ts    # 기능 3: AI 지원자 분석
```

### 5.2 공통 Gemini 클라이언트 (`lib/ai/shared.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// 싱글톤 (기존 matching.ts 패턴)
let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getModel(modelName = 'gemini-2.0-flash') {
  return getGeminiClient().getGenerativeModel({ model: modelName });
}

// JSON 파싱 유틸리티
export function parseAIJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleaned);
}

// 입력 새니타이징
export function sanitizeInput(input: string): string {
  return input
    .replace(/['"`;\\]/g, '')
    .replace(/--/g, '')
    .trim()
    .slice(0, 2000);
}

// AI 재시도 래퍼
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
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}
```

### 5.3 기존 matching.ts 리팩토링

```
현재: lib/ai/matching.ts에 Gemini 초기화 + sanitize + JSON파싱 모두 포함
변경: 공통 로직을 shared.ts로 추출, matching.ts는 import하여 사용
영향: matching.ts의 외부 인터페이스(함수명, 매개변수)는 변경 없음
```

### 5.4 환경변수 추가

```env
# .env.local에 추가

# 기존
GEMINI_API_KEY=...

# 신규
CRON_SECRET=...  # Vercel Cron 인증용 시크릿 키
```

---

## 6. 데이터베이스 마이그레이션

### 전체 마이그레이션 파일 목록 (10개)

```
supabase/migrations/
├── (기존 001~019)
├── 020_auto_apply_settings.sql      # 자동 지원 설정 테이블
├── 021_auto_apply_logs.sql          # 자동 지원 로그 테이블
├── 022_applications_auto_fields.sql # applications 테이블 컬럼 추가
├── 023_company_bot_settings.sql     # 챗봇 설정 테이블
├── 024_company_bot_faq.sql          # FAQ 테이블
├── 025_messages_ai_columns.sql      # messages 테이블 AI 컬럼 추가
├── 026_message_chatbot_trigger.sql  # 메시지 라우팅 트리거
├── 027_applicant_analysis.sql       # 지원자 분석 테이블
├── 028_notification_templates.sql   # 알림 템플릿 테이블
└── 029_seed_notification_templates.sql  # 시드 데이터
```

### 마이그레이션 실행 순서

```bash
# 로컬 Supabase에서
supabase db push

# 또는 개별 실행
supabase migration up
```

### 롤백 전략

각 마이그레이션은 독립적이므로 개별 롤백 가능:
```sql
-- 예: 자동 지원 기능만 롤백
DROP TABLE IF EXISTS auto_apply_logs;
DROP TABLE IF EXISTS auto_apply_settings;
ALTER TABLE applications DROP COLUMN IF EXISTS is_auto_applied;
ALTER TABLE applications DROP COLUMN IF EXISTS auto_apply_log_id;
```

---

## 7. 구현 로드맵

### 구현 순서 결정 근거

| 기능 | 기존 코드 의존성 | 신규 인프라 필요 | 즉각 가치 | 순서 |
|------|----------------|---------------|----------|------|
| ③ AI 지원자 분석 | 높음 (기존 applicants API 위에 추가) | 낮음 | 높음 | **1번째** |
| ② AI 기업 챗봇 | 중간 (기존 chat 위에 추가) | 중간 (DB 트리거) | 중간 | **2번째** |
| ① AI 자동 지원 | 중간 (기존 matching 재사용) | 높음 (Cron 스케줄러) | 높음 | **3번째** |

### Phase 1: 공통 인프라 (Day 1)

```
□ lib/ai/shared.ts 생성
  - getGeminiClient(), getModel()
  - parseAIJsonResponse(), sanitizeInput()
  - withAIRetry()
□ lib/ai/matching.ts 리팩토링
  - shared.ts에서 import하도록 변경
  - 기존 동작 유지 확인
□ 마이그레이션 020~029 생성 및 적용
□ lib/validations.ts에 신규 스키마 4개 추가
  - autoApplySettingsSchema
  - companyBotSettingsSchema
  - botFaqSchema
  - confirmApplicationSchema
□ 환경변수 설정 (CRON_SECRET)
```

### Phase 2: AI 지원자 분석 (Day 2~3)

```
Day 2:
□ lib/ai/applicant-analysis.ts 생성
  - analyzeApplicant() 함수
  - ANALYZE_APPLICANT_PROMPT 프롬프트
□ app/api/jobs/[id]/applicants/analyze/route.ts 생성
  - POST: 전체 지원자 일괄 분석
□ app/api/jobs/[id]/applicants/route.ts 수정
  - applicant_analysis LEFT JOIN
  - sort=match_score 옵션 추가
□ lib/hooks/use-applicant-analysis.ts 생성
  - useApplicantAnalysis(jobId) 훅
  - triggerAnalysis(), analysisData, loading

Day 3:
□ components/features/ApplicantAnalysisCard.tsx 생성
□ components/features/ScoreBreakdown.tsx 생성
□ app/jobs/[id]/applicants/page.tsx 대폭 수정
  - [AI 분석 실행] 버튼
  - AI 분석 카드 통합
  - 정렬 드롭다운
□ app/api/jobs/[id]/applicants/[appId]/confirm/route.ts 생성
  - accept/reject 동작
  - 자동 채팅방 생성 + 메시지 전송
  - 일괄 거절 + 계약 초안 생성
□ components/features/ConfirmDialog.tsx 생성
□ 테스트: 5명 지원자 분석 → 확정 → 메시지 확인
```

### Phase 3: AI 기업 챗봇 (Day 4~5)

```
Day 4:
□ lib/ai/company-bot.ts 생성
  - generateBotResponse() 함수
  - CHATBOT_RESPONSE_PROMPT 프롬프트
  - checkEscalation() 함수
  - isWithinSchedule() 함수
□ app/api/company-bot/settings/route.ts 생성
□ app/api/company-bot/faq/route.ts 생성
□ app/api/company-bot/faq/[id]/route.ts 생성
□ app/api/company-bot/respond/route.ts 생성
□ app/api/company-bot/stats/route.ts 생성
□ 마이그레이션 026 (DB 트리거) 배포
□ lib/hooks/use-company-bot.ts 생성

Day 5:
□ app/settings/company-bot/page.tsx 생성
  - 챗봇 ON/OFF, 응대 시간, 톤, 에스컬레이션 키워드
□ app/settings/company-bot/faq/page.tsx 생성
  - FAQ CRUD UI
□ components/features/AiBadge.tsx 생성
□ components/features/ChatBubble.tsx 수정
  - is_ai_response 배지 + 안내 문구
□ app/chat/page.tsx 수정
  - AI 응답 메시지 스타일 구분
□ lib/hooks/use-chat.ts 수정
  - is_ai_response, escalated 필드 추가
□ app/settings/page.tsx 수정
  - "AI 챗봇 관리" 섹션 (company 전용)
□ 테스트: 기술자→기업 메시지 → AI 응답 → 에스컬레이션
```

### Phase 4: AI 자동 지원 (Day 6~7)

```
Day 6:
□ lib/ai/auto-apply.ts 생성
  - generateApplicationMessage() 함수
  - GENERATE_APPLICATION_PROMPT 프롬프트
  - executeAutoApply() 메인 로직
□ app/api/auto-apply/settings/route.ts 생성
□ app/api/auto-apply/logs/route.ts 생성
□ app/api/auto-apply/execute/route.ts 생성
□ app/api/auto-apply/preview/route.ts 생성
□ app/api/auto-apply/cron/route.ts 생성
□ vercel.json에 cron 설정 추가
□ lib/hooks/use-auto-apply.ts 생성

Day 7:
□ app/settings/auto-apply/page.tsx 생성
  - 자동 지원 ON/OFF, 시간, 필터, 템플릿
□ components/features/AutoApplyLogCard.tsx 생성
□ components/features/AutoApplyStats.tsx 생성
□ app/dashboard/worker/page.tsx 수정
  - "오늘 AI 지원 N건" 알림 배너
□ app/applications/page.tsx 수정
  - is_auto_applied 시 🤖 배지
□ app/settings/page.tsx 수정
  - "AI 자동 지원" 섹션 (worker 전용)
□ 테스트: 설정 → 수동 실행 → 지원 확인 → 로그 확인
```

### Phase 5: 통합 테스트 + 최적화 (Day 8)

```
□ 전체 플로우 통합 테스트
  ├── 기술자 자동 지원 → 기업 AI 분석 → 확정 → 자동 메시지
  ├── 기술자 질문 → AI 챗봇 응답 → 에스컬레이션
  └── 일괄 거절 → 계약 초안 → 메시지 확인
□ AI 응답 품질 검증 (각 기능 10개 샘플)
□ 성능 최적화
  ├── Gemini 호출 병렬화 (Promise.allSettled)
  ├── 분석 결과 캐싱 (applicant_analysis)
  └── 에러 시 재시도 (withAIRetry)
□ 에러 시나리오 검증
  ├── Gemini API 다운 시 graceful 처리
  ├── 잘못된 JSON 응답 처리
  └── 프로필 미완성 시 자동 지원 차단
□ 코드 리뷰 및 최종 커밋
```

### 전체 일정 요약

| Phase | 기간 | 산출물 |
|-------|------|--------|
| 1. 공통 인프라 | Day 1 | shared.ts, 마이그레이션, 스키마 |
| 2. AI 지원자 분석 | Day 2~3 | 분석 API, 확정/거절, UI |
| 3. AI 기업 챗봇 | Day 4~5 | 챗봇 엔진, FAQ 관리, 트리거 |
| 4. AI 자동 지원 | Day 6~7 | 자동 지원, 스케줄러, 설정 UI |
| 5. 통합 테스트 | Day 8 | E2E, 최적화, 배포 준비 |
| **합계** | **8일** | |

---

## 8. 테스트 전략

### 8.1 단위 테스트

| 대상 | 테스트 항목 |
|------|-----------|
| `lib/ai/shared.ts` | JSON 파싱 (정상/비정상), 새니타이징, 재시도 |
| `lib/ai/auto-apply.ts` | 프롬프트 구성, 응답 파싱, 필터 적용 |
| `lib/ai/company-bot.ts` | 에스컬레이션 감지, 응대 시간 판단, 응답 파싱 |
| `lib/ai/applicant-analysis.ts` | 스코어링, 등급 산출, 응답 파싱 |
| `lib/validations.ts` | 4개 신규 스키마 검증 |

### 8.2 통합 테스트

| 시나리오 | 단계 |
|----------|------|
| 자동 지원 | 설정 저장 → 매칭 → 지원서 생성 → 지원 제출 → 로그 기록 |
| 챗봇 응대 | 메시지 수신 → 설정 확인 → AI 응답 → 에스컬레이션 |
| 지원자 분석 | 분석 요청 → AI 스코어링 → 정렬 → 확정 → 메시지 전송 |
| 확정 자동화 | 확정 → 채팅방 생성 → 메시지 → 일괄 거절 → 계약 |

### 8.3 AI 품질 테스트 (각 10개 샘플)

```
기능 1 (자동 지원):
- 완벽 매칭 → 높은 점수 + 구체적 지원서
- 부분 매칭 → 중간 점수 + 강점 강조
- 불일치 → 낮은 점수 + 건너뜀
- 템플릿 → 구조 유지 + 공고 맞춤

기능 2 (챗봇):
- FAQ 일치 → FAQ 답변 활용
- 공고 정보 → 정확한 정보 제공
- 모호한 질문 → "담당자 확인" 응대
- 에스컬레이션 → 즉시 에스컬레이션

기능 3 (지원자 분석):
- A등급 → 80점+ 정확한 강점
- D등급 → 39점 이하, 사유 명확
- 동점 → 차별화 요소 설명
- 경계값 → 등급 정확성
```

---

## 9. 비용 및 수익 모델

### 9.1 AI 비용 예측 (Gemini 3.0 Flash)

| 기능 | 호출/일 | 토큰/회 | 월간 비용 (1,000 사용자) |
|------|---------|---------|------------------------|
| 자동 지원 | ~300회 | ~1,500 | ~$13.50 |
| 챗봇 응대 | ~500회 | ~1,000 | ~$11.25 |
| 지원자 분석 | ~50회 | ~2,000 | ~$4.50 |
| **합계** | | | **~$29.25/월** |

> 기준: input $0.10/1M tokens, output $0.40/1M tokens

### 9.2 프리미엄 플랜

| 구분 | 무료 | 프리미엄 (월 ₩19,900) |
|------|------|----------------------|
| AI 자동 지원 | 월 10건 | 무제한 |
| 지원서 AI 작성 | 기본 | 맞춤 프롬프트 + 미리보기 |
| AI 챗봇 | FAQ 5개 | FAQ 무제한 + 맞춤 톤 |
| 지원자 AI 분석 | 월 20명 | 무제한 |
| 자동 확정 메시지 | 수동만 | 자동 + 일괄 처리 |

### 9.3 사용량 제한 구현

```typescript
// lib/ai/shared.ts

const FREE_LIMITS = {
  auto_apply_monthly: 10,
  bot_faq_count: 5,
  applicant_analysis_monthly: 20,
} as const;

export async function checkAILimit(
  supabase: SupabaseClient,
  userId: string,
  feature: keyof typeof FREE_LIMITS
): Promise<{ allowed: boolean; remaining: number }> {
  // TODO: premium_subscriptions 테이블 확인
  // 프리미엄이면 → { allowed: true, remaining: Infinity }
  // 무료이면 → 월간 사용량 카운트 후 제한 확인
}
```

---

## 10. 전체 파일 목록

### 신규 API Routes (13개)

```
app/api/auto-apply/settings/route.ts              GET, PUT
app/api/auto-apply/logs/route.ts                   GET
app/api/auto-apply/execute/route.ts                POST
app/api/auto-apply/preview/route.ts                POST
app/api/auto-apply/cron/route.ts                   POST
app/api/company-bot/settings/route.ts              GET, PUT
app/api/company-bot/faq/route.ts                   GET, POST
app/api/company-bot/faq/[id]/route.ts              PUT, DELETE
app/api/company-bot/respond/route.ts               POST
app/api/company-bot/stats/route.ts                 GET
app/api/jobs/[id]/applicants/analyze/route.ts      POST
app/api/jobs/[id]/applicants/[appId]/confirm/route.ts  POST
```

### 신규 페이지 (3개)

```
app/settings/auto-apply/page.tsx
app/settings/company-bot/page.tsx
app/settings/company-bot/faq/page.tsx
```

### 신규 AI 모듈 (4개)

```
lib/ai/shared.ts
lib/ai/auto-apply.ts
lib/ai/company-bot.ts
lib/ai/applicant-analysis.ts
```

### 신규 훅 (3개)

```
lib/hooks/use-auto-apply.ts
lib/hooks/use-company-bot.ts
lib/hooks/use-applicant-analysis.ts
```

### 신규 컴포넌트 (6개)

```
components/features/AutoApplyLogCard.tsx
components/features/AutoApplyStats.tsx
components/features/ApplicantAnalysisCard.tsx
components/features/ScoreBreakdown.tsx
components/features/ConfirmDialog.tsx
components/features/AiBadge.tsx
```

### 신규 DB 마이그레이션 (10개)

```
supabase/migrations/020~029
```

### 수정 파일 (10개)

```
lib/ai/matching.ts                      (공통 로직 추출)
lib/validations.ts                      (4개 스키마 추가)
app/settings/page.tsx                   (AI 섹션 2개 추가)
app/dashboard/worker/page.tsx           (자동 지원 알림 배너)
app/applications/page.tsx               (자동 지원 배지)
app/jobs/[id]/applicants/page.tsx       (AI 분석 UI 통합)
app/api/jobs/[id]/applicants/route.ts   (LEFT JOIN 추가)
app/chat/page.tsx                       (AI 응답 스타일)
components/features/ChatBubble.tsx      (AI 배지)
lib/hooks/use-chat.ts                   (is_ai_response 필드)
```

### 총계

| 구분 | 파일 수 |
|------|--------|
| 신규 파일 | 39개 |
| 수정 파일 | 10개 |
| DB 마이그레이션 | 10개 |
| **합계** | **49개 + 10 마이그레이션** |

---

## 3개 기능 시너지 맵

```
┌──────────────────────────────────────────────────┐
│              건설人 AI 생태계                       │
│                                                    │
│  [기술자 측]              [기업 측]                  │
│                                                    │
│  ① AI 자동 지원           ③ AI 지원자 분석          │
│  ┌─────────┐             ┌─────────┐              │
│  │프로필 기반│   지원서    │적합도 평점│              │
│  │공고 매칭  │──────────→│AI 요약   │              │
│  │자동 지원  │            │순위 정렬  │              │
│  └─────────┘            └────┬────┘              │
│       ↑                      │ 확정                │
│       │                      ↓                     │
│       │              자동 메시지 전송               │
│       │                      │                     │
│       │                      ↓                     │
│  ┌────┴────┐            ② AI 챗봇                 │
│  │질문 응답  │←─────────│기업 정보 기반│             │
│  │(지원자)  │   AI 응대  │자동 응대   │             │
│  └─────────┘            └─────────┘              │
│                                                    │
│  순환: 자동지원 → AI분석 → 확정 → AI응대 → 계약    │
└──────────────────────────────────────────────────┘
```

---

> **예상 구현 기간**: 8일 (1인 기준)
> **신규 파일**: ~39개 + 마이그레이션 10개
> **AI 월간 비용**: ~$29 (1,000 사용자 기준)
> **수익 모델**: 프리미엄 ₩19,900/월
