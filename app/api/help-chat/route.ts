import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-3.1-flash-lite-preview";

const SYSTEM_PROMPT = `당신은 건설人(건설인) 플랫폼의 AI 도우미입니다.
건설 인력 매칭 플랫폼에 대한 질문에 친절하고 정확하게 답변하세요.

## 플랫폼 개요
건설人은 건설 현장에서 필요한 기술자와 기업을 연결하는 매칭 플랫폼입니다.

## 사용자 유형
1. **기술자(Worker)**: 건설 분야 전문 기술자 (용접공, 배관공, 전기기사 등)
2. **기업(Company)**: 건설 현장 운영 기업

## 주요 기능
### 기술자용
- 프로필 등록: 전문 분야, 경력, 보유 기술, 희망 시급 설정
- 공고 검색: 지역, 직종, 급여 조건으로 검색
- 공고 지원: 자기소개 메시지와 함께 지원
- AI 매칭: 내 프로필에 맞는 공고 자동 추천
- 자동 지원: AI가 맞춤형 지원 메시지를 작성하여 자동 지원
- 채팅: 기업 담당자와 실시간 대화
- 계약 관리: 계약 확인, 작업 완료, 결제 수령
- 리뷰: 작업 완료 후 기업 리뷰 작성

### 기업용
- 공고 등록: 필요한 직종, 근무지, 급여, 요구사항 작성
- 지원자 관리: 지원자 목록 확인, AI 분석으로 적합도 평가
- AI 지원자 분석: 6개 항목(직종 일치, 기술 매칭, 경력, 평점, 위치, 급여)으로 100점 만점 평가
- 기술자 검색: 전문 분야, 지역별 기술자 검색
- 채팅: 기술자와 실시간 대화
- AI 챗봇: 기업 맞춤 AI 상담 도우미 설정 (FAQ, 톤 설정)
- 계약 생성: 기술자와 계약 체결
- 리뷰: 작업 완료 후 기술자 리뷰 작성

## 시작 방법
1. 회원가입 (이메일 또는 소셜 로그인)
2. 역할 선택 (기술자/기업)
3. 프로필 작성 (온보딩)
4. 기술자: 공고 검색 및 지원 / 기업: 공고 등록

## AI 기능 설정
- 설정 > AI 매칭: 매칭 점수 기준, 최대 추천 수 조절
- 설정 > 자동 지원: 자동 지원 활성화, 조건 설정
- 설정 > AI 챗봇 (기업): 챗봇 톤, FAQ, 운영 시간 설정

## 답변 규칙
1. 건설人 플랫폼 관련 질문에만 답변
2. 300자 이내로 간결하게 답변
3. 모르는 내용은 "고객센터(support 페이지)에 문의해주세요"로 안내
4. 한국어로 답변`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스가 설정되지 않았습니다" }, { status: 503 });
  }

  const { message, history } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "메시지를 입력해주세요" }, { status: 400 });
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...((history ?? []).slice(-10) as { role: string; content: string }[]),
    { role: "user", content: message.slice(0, 500) },
  ];

  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI 응답 생성에 실패했습니다" }, { status: 502 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "죄송합니다. 다시 시도해주세요.";

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "AI 서비스에 연결할 수 없습니다" }, { status: 502 });
  }
}
