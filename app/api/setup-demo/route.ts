import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";

// Admin 클라이언트 (service role key로 auth.admin 사용)
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type AdminClient = ReturnType<typeof getAdminClient>;

interface DemoWorker {
  email: string;
  name: string;
  specialty: string;
  experience: number;
  bio: string;
  location: string;
  hourly_rate: number;
  skills: string[];
  rating: number;
  review_count: number;
  completed_jobs: number;
}

interface DemoCompany {
  email: string;
  name: string;
  company_name: string;
  biz_number: string;
  ceo: string;
  industry: string;
  employees: string;
  address: string;
  description: string;
}

const DEMO_WORKERS: DemoWorker[] = [
  { email: "worker1@demo.com", name: "김철수", specialty: "배관공", experience: 15, bio: "15년 경력의 배관 전문가입니다. 수도/난방/가스 배관 전문.", location: "서울 강남구", hourly_rate: 45000, skills: ["수도배관","난방배관","가스배관","누수수리"], rating: 4.8, review_count: 127, completed_jobs: 342 },
  { email: "worker2@demo.com", name: "이영희", specialty: "전기기사", experience: 10, bio: "전기기사 1급 자격증 보유. 내선/조명/분전반 전문.", location: "서울 서초구", hourly_rate: 50000, skills: ["내선공사","조명설치","분전반","접지공사"], rating: 4.9, review_count: 89, completed_jobs: 256 },
  { email: "worker3@demo.com", name: "박민수", specialty: "철근공", experience: 8, bio: "아파트/오피스 철근 콘크리트 전문. 안전관리 자격증 보유.", location: "경기 수원시", hourly_rate: 42000, skills: ["철근배근","콘크리트타설","거푸집","안전관리"], rating: 4.6, review_count: 64, completed_jobs: 178 },
  { email: "worker4@demo.com", name: "최지훈", specialty: "도장공", experience: 12, bio: "인테리어/외벽 도장 12년 경력. 친환경 도료 전문.", location: "서울 마포구", hourly_rate: 38000, skills: ["내부도장","외벽도장","방수도장","친환경도료"], rating: 4.7, review_count: 95, completed_jobs: 287 },
  { email: "worker5@demo.com", name: "정하나", specialty: "타일공", experience: 7, bio: "욕실/주방 타일 시공 전문. 대리석/포세린 경험 풍부.", location: "서울 송파구", hourly_rate: 40000, skills: ["바닥타일","벽타일","대리석","줄눈시공"], rating: 4.5, review_count: 42, completed_jobs: 134 },
  { email: "worker6@demo.com", name: "오성현", specialty: "용접공", experience: 20, bio: "20년 경력 용접 마스터. 특수강/스테인리스 전문.", location: "인천 남동구", hourly_rate: 55000, skills: ["아크용접","TIG용접","MIG용접","특수강용접"], rating: 4.9, review_count: 156, completed_jobs: 412 },
];

const DEMO_COMPANIES: DemoCompany[] = [
  { email: "company1@demo.com", name: "한양건설", company_name: "한양건설", biz_number: "123-45-67890", ceo: "김한양", industry: "종합건설", employees: "150명", address: "서울 강남구 테헤란로 123", description: "30년 전통의 종합 건설사. 아파트/오피스 전문." },
  { email: "company2@demo.com", name: "테크파크건설", company_name: "테크파크건설", biz_number: "234-56-78901", ceo: "이테크", industry: "IT건설", employees: "80명", address: "경기 성남시 판교로 456", description: "IT빌딩 전문 건설/관리. 스마트빌딩 시공." },
  { email: "company3@demo.com", name: "대한인테리어", company_name: "대한인테리어", biz_number: "345-67-89012", ceo: "박대한", industry: "인테리어", employees: "45명", address: "서울 마포구 홍대입구역 789", description: "상업공간/주거공간 인테리어 전문. 디자인 시공 일괄." },
  { email: "company4@demo.com", name: "서울플랜트", company_name: "서울플랜트", biz_number: "456-78-90123", ceo: "최서울", industry: "설비건설", employees: "200명", address: "경기 화성시 동탄대로 101", description: "대형 플랜트/공장 설비 시공 전문. ISO 14001 인증." },
];

const DEMO_ADMIN = { email: "admin@demo.com", name: "관리자", password: "demo1234" };

// auth 유저 생성/조회 헬퍼 - 여러 방법을 시도
async function ensureAuthUser(
  supabase: AdminClient,
  email: string,
  password: string,
  metadata: Record<string, string>,
  existingUsers: { id: string; email?: string }[]
): Promise<{ id: string; method: string } | { error: string }> {
  // 1차: 이미 존재하는지 확인
  const existing = existingUsers.find((u) => u.email === email);
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: metadata,
    });
    return { id: existing.id, method: "기존 유저 업데이트" };
  }

  // 2차: admin.createUser 시도
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (created?.user) {
    return { id: created.user.id, method: "새 유저 생성" };
  }

  // 3차: signUp 시도 (GoTrue의 다른 코드 경로 사용)
  const { data: signedUp, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (signedUp?.user) {
    // signUp으로 생성된 유저 이메일 확인 처리
    await supabase.auth.admin.updateUserById(signedUp.user.id, {
      email_confirm: true,
      user_metadata: metadata,
    });
    return { id: signedUp.user.id, method: "signUp 경로로 생성" };
  }

  // 4차: 직접 GoTrue REST API 호출
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey!,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      }),
    });

    if (res.ok) {
      const user = await res.json();
      return { id: user.id, method: "REST API로 생성" };
    }

    const errBody = await res.text();
    return {
      error: `모든 방법 실패 - createUser: ${createErr?.message}, signUp: ${signUpErr?.message}, REST: ${errBody}`,
    };
  } catch (fetchErr) {
    return {
      error: `모든 방법 실패 - createUser: ${createErr?.message}, signUp: ${signUpErr?.message}, fetch: ${fetchErr}`,
    };
  }
}

export async function POST() {
  const supabase = getAdminClient();
  const results: string[] = [];

  // 1. 기존 고아 프로필 정리
  const oldIds = [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
    "00000000-0000-0000-0000-000000000003",
    "00000000-0000-0000-0000-000000000004",
    "00000000-0000-0000-0000-000000000005",
    "00000000-0000-0000-0000-000000000006",
    "00000000-0000-0000-0000-000000000011",
    "00000000-0000-0000-0000-000000000012",
    "00000000-0000-0000-0000-000000000013",
    "00000000-0000-0000-0000-000000000014",
  ];

  await supabase.from("worker_profiles").delete().in("id", oldIds);
  await supabase.from("company_profiles").delete().in("id", oldIds);
  await supabase.from("profiles").delete().in("id", oldIds);
  results.push("기존 고아 데이터 정리 완료");

  // 전체 유저 목록 한 번만 조회
  const { data: allUsersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUsers = allUsersData?.users ?? [];

  // 2. 기술자 데모 계정 생성
  for (const w of DEMO_WORKERS) {
    const result = await ensureAuthUser(
      supabase, w.email, "demo1234",
      { name: w.name, role: "worker" },
      existingUsers
    );

    if ("error" in result) {
      results.push(`${w.email}: ${result.error}`);
      continue;
    }

    await setupWorkerProfile(supabase, result.id, w);
    results.push(`${w.email}: ${result.method} (${result.id})`);
  }

  // 3. 기업 데모 계정 생성
  for (const c of DEMO_COMPANIES) {
    const result = await ensureAuthUser(
      supabase, c.email, "demo1234",
      { name: c.name, role: "company" },
      existingUsers
    );

    if ("error" in result) {
      results.push(`${c.email}: ${result.error}`);
      continue;
    }

    await setupCompanyProfile(supabase, result.id, c);
    results.push(`${c.email}: ${result.method} (${result.id})`);
  }

  // 4. 관리자 데모 계정 생성
  {
    const result = await ensureAuthUser(
      supabase, DEMO_ADMIN.email, DEMO_ADMIN.password,
      { name: DEMO_ADMIN.name, role: "admin" },
      existingUsers
    );

    if ("error" in result) {
      results.push(`${DEMO_ADMIN.email}: ${result.error}`);
    } else {
      await supabase.from("profiles").upsert(
        { id: result.id, role: "worker" as const, name: DEMO_ADMIN.name, email: DEMO_ADMIN.email },
        { onConflict: "id" }
      );
      results.push(`${DEMO_ADMIN.email}: ${result.method} (${result.id})`);
    }
  }

  // 5. 데모 공고 생성
  const companyEmails = ["company1@demo.com", "company2@demo.com", "company3@demo.com", "company4@demo.com"];
  const companyIds: Record<string, string> = {};

  for (const email of companyEmails) {
    const { data } = await supabase.from("profiles").select("id").eq("email", email).single();
    if (data) companyIds[email] = data.id;
  }

  // 기존 데모 공고 삭제 후 재생성
  for (const cid of Object.values(companyIds)) {
    await supabase.from("jobs").delete().eq("company_id", cid);
  }

  const now = new Date();
  const futureDate = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();
  const pastDate = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

  const demoJobs = [
    { company_id: companyIds["company1@demo.com"], title: "강남 오피스텔 배관 교체 공사", location: "서울 강남구", salary: "일 35만원", type: "단기 (2주)", description: "강남구 소재 오피스텔 30세대 노후 배관 전면 교체 작업입니다. PVC/동파이프 교체 경험 필수.", requirements: ["배관공 경력 5년 이상","PVC 배관 시공 경험","자격증 소지자 우대"], benefits: ["중식 제공","주차 가능","안전장비 지급"], applicant_count: 12, status: "active" as const, deadline: futureDate(14) },
    { company_id: companyIds["company1@demo.com"], title: "서초 아파트 난방 배관 공사", location: "서울 서초구", salary: "일 40만원", type: "단기 (1주)", description: "서초구 대단지 아파트 난방 배관 교체. 동절기 전 긴급 시공.", requirements: ["난방배관 경력 3년 이상","보일러 배관 경험","자격증 우대"], benefits: ["식대 제공","교통비 지원"], applicant_count: 5, status: "active" as const, deadline: futureDate(7) },
    { company_id: companyIds["company1@demo.com"], title: "잠실 주상복합 배관 시공", location: "서울 송파구", salary: "일 38만원", type: "장기 (3개월)", description: "잠실 신축 주상복합 배관 시공 완료. 감사합니다.", requirements: ["배관공 경력 7년 이상","대형 현장 경험"], benefits: ["4대보험","중식제공","기숙사"], applicant_count: 28, status: "closed" as const, deadline: pastDate(10) },
    { company_id: companyIds["company2@demo.com"], title: "판교 IT센터 전기 공사", location: "경기 성남시", salary: "일 45만원", type: "장기 (2개월)", description: "판교 테크노밸리 IT센터 신축 전기 내선 공사. 스마트빌딩 자동화 설비 포함.", requirements: ["전기기사 자격증 필수","내선공사 5년 이상","스마트빌딩 경험 우대"], benefits: ["4대보험","중식 제공","통근버스","성과급"], applicant_count: 8, status: "active" as const, deadline: futureDate(21) },
    { company_id: companyIds["company2@demo.com"], title: "분당 오피스 LED 조명 교체", location: "경기 성남시", salary: "일 32만원", type: "단기 (3일)", description: "분당 오피스빌딩 전층 LED 조명 교체 완료.", requirements: ["조명설치 경험 2년 이상"], benefits: ["식대 제공"], applicant_count: 15, status: "closed" as const, deadline: pastDate(5) },
    { company_id: companyIds["company3@demo.com"], title: "홍대 카페 인테리어 도장 공사", location: "서울 마포구", salary: "일 30만원", type: "단기 (5일)", description: "홍대 신규 카페 매장 내부 도장 공사. 친환경 도료 사용 필수. 디자인 시안에 맞춘 색상 시공.", requirements: ["도장 경력 3년 이상","실내 도장 경험","친환경 도료 경험 우대"], benefits: ["식대 제공","교통비 지원"], applicant_count: 3, status: "active" as const, deadline: futureDate(5) },
    { company_id: companyIds["company3@demo.com"], title: "강남 고급 주택 타일 시공", location: "서울 강남구", salary: "일 42만원", type: "단기 (1주)", description: "강남 단독주택 욕실 3곳 + 주방 타일 전면 시공. 대리석/포세린 타일.", requirements: ["타일 시공 5년 이상","대리석 경험 필수","포세린 타일 경험 우대"], benefits: ["재료비 별도","중식 제공","주차 가능"], applicant_count: 7, status: "active" as const, deadline: futureDate(10) },
    { company_id: companyIds["company3@demo.com"], title: "성수동 사무실 리모델링", location: "서울 성동구", salary: "일 35만원", type: "단기 (2주)", description: "성수동 사무실 리모델링 공사 완료.", requirements: ["인테리어 경력 5년 이상","다기능 시공 가능자"], benefits: ["4대보험","식대"], applicant_count: 20, status: "closed" as const, deadline: pastDate(15) },
    { company_id: companyIds["company4@demo.com"], title: "화성 반도체 공장 용접 공사", location: "경기 화성시", salary: "일 55만원", type: "장기 (6개월)", description: "화성 반도체 공장 배관 용접 공사. TIG/특수강 용접 기술 필수. 클린룸 내 작업.", requirements: ["용접기능사 이상","TIG 용접 경력 10년 이상","클린룸 경험 우대","산업안전교육 이수"], benefits: ["4대보험","기숙사 제공","중식/석식","통근버스","연장근무수당"], applicant_count: 4, status: "active" as const, deadline: futureDate(30) },
    { company_id: companyIds["company4@demo.com"], title: "동탄 물류센터 철골 공사", location: "경기 화성시", salary: "일 48만원", type: "장기 (4개월)", description: "동탄 대형 물류센터 철골 구조물 시공. 고소 작업 포함.", requirements: ["철근공 경력 5년 이상","고소작업 경험","안전관리 자격증 우대"], benefits: ["4대보험","기숙사","중식 제공","안전장비 지급"], applicant_count: 9, status: "active" as const, deadline: futureDate(20) },
    { company_id: companyIds["company4@demo.com"], title: "인천 공장 설비 배관 공사", location: "인천 남동구", salary: "일 50만원", type: "장기 (3개월)", description: "인천 산업단지 공장 설비 배관 공사 완료.", requirements: ["배관 용접 경력 8년 이상","산업설비 경험"], benefits: ["4대보험","기숙사","통근버스"], applicant_count: 32, status: "closed" as const, deadline: pastDate(20) },
  ].filter((j) => j.company_id);

  if (demoJobs.length > 0) {
    const { error: jobErr } = await supabase.from("jobs").insert(demoJobs);
    if (jobErr) {
      results.push(`공고 생성 실패: ${jobErr.message}`);
    } else {
      results.push(`데모 공고 ${demoJobs.length}건 생성 완료 (공고중 ${demoJobs.filter(j => j.status === "active").length}건, 마감 ${demoJobs.filter(j => j.status === "closed").length}건)`);
    }
  } else {
    results.push("기업 계정이 없어 공고를 생성하지 못했습니다");
  }

  return NextResponse.json({ success: true, results });
}

async function setupWorkerProfile(supabase: AdminClient, userId: string, w: DemoWorker) {
  await supabase.from("profiles").upsert(
    { id: userId, role: "worker" as const, name: w.name, email: w.email },
    { onConflict: "id" }
  );
  await supabase.from("worker_profiles").upsert(
    {
      id: userId,
      specialty: w.specialty,
      experience: w.experience,
      bio: w.bio,
      location: w.location,
      hourly_rate: w.hourly_rate,
      available: true,
      skills: w.skills,
      rating: w.rating,
      review_count: w.review_count,
      completed_jobs: w.completed_jobs,
    },
    { onConflict: "id" }
  );
}

async function setupCompanyProfile(supabase: AdminClient, userId: string, c: DemoCompany) {
  await supabase.from("profiles").upsert(
    { id: userId, role: "company" as const, name: c.name, email: c.email },
    { onConflict: "id" }
  );
  await supabase.from("company_profiles").upsert(
    {
      id: userId,
      company_name: c.company_name,
      biz_number: c.biz_number,
      ceo: c.ceo,
      industry: c.industry,
      employees: c.employees,
      address: c.address,
      description: c.description,
    },
    { onConflict: "id" }
  );
}
