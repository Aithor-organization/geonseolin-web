# 건설人 (건설인) - 건설 인력 매칭 플랫폼

건설 현장에서 필요한 기술자와 기업을 연결하는 매칭 플랫폼입니다.

## 기술 스택

| 구성요소 | 기술 |
|----------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (이메일/비밀번호, 카카오, 네이버) |
| 실시간 | Supabase Realtime (채팅) |
| 배포 | Vercel |

## 주요 기능

### 기술자 (Worker)
- 프로필 등록 및 관리 (전문 분야, 경력, 기술, 시급)
- 공고 검색 및 지원
- 실시간 채팅
- 계약 관리 및 작업 완료 확인
- 기업 리뷰 작성 (증명 기반)

### 기업 (Company)
- 기업 등록 및 승인
- 공고 등록 및 지원자 관리
- 기술자 검색 및 제안
- 실시간 채팅
- 계약 생성 및 관리
- 기술자 리뷰 작성

### 관리자 (Admin)
- 사용자 관리
- 기업 승인
- 공고 관리
- 신고 처리
- 통계 대시보드

## 페이지 구조

```
/ .......................... 홈 (랜딩)
/login ..................... 로그인
/signup .................... 회원가입
/onboarding ................ 프로필 설정
/dashboard/worker .......... 기술자 대시보드
/dashboard/company ......... 기업 대시보드
/search .................... 기술자 검색
/workers/[id] .............. 기술자 상세 프로필
/jobs ...................... 공고 목록
/jobs/[id] ................. 공고 상세
/jobs/new .................. 공고 등록
/applications .............. 지원 내역
/chat ...................... 채팅
/contracts ................. 계약 목록
/contracts/[id] ............ 계약 상세
/review/[id] ............... 리뷰 작성
/payment ................... 결제
/payment/history ........... 결제 내역
/favorites ................. 즐겨찾기
/profile/worker ............ 기술자 프로필 편집
/profile/company ........... 기업 프로필 편집
/settings .................. 설정
/admin ..................... 관리자 대시보드
```

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정

# 개발 서버
npm run dev
```

## 환경변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (서버 전용) |

## 데이터베이스

Supabase 마이그레이션 파일은 `supabase/migrations/` 디렉토리에 있습니다.

```bash
# Supabase 로컬 시작
supabase start

# 마이그레이션 적용
supabase db push

# 타입 생성
supabase gen types typescript --local > lib/supabase/types.ts
```

## 라이선스

Private - All rights reserved.
