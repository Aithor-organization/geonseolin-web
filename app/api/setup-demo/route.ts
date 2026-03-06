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
  { email: "worker1@demo.com", name: "김철수", specialty: "배관공", experience: 15, bio: "15년 경력의 배관 전문가입니다.", location: "서울 강남구", hourly_rate: 45000, skills: ["수도배관","난방배관","가스배관","누수수리"], rating: 4.8, review_count: 127, completed_jobs: 342 },
  { email: "worker2@demo.com", name: "이영희", specialty: "전기기사", experience: 10, bio: "전기기사 1급 자격증 보유.", location: "서울 서초구", hourly_rate: 50000, skills: ["내선공사","조명설치","분전반","접지공사"], rating: 4.9, review_count: 89, completed_jobs: 256 },
];

const DEMO_COMPANIES: DemoCompany[] = [
  { email: "company1@demo.com", name: "한양건설", company_name: "한양건설", biz_number: "123-45-67890", ceo: "김한양", industry: "종합건설", employees: "150명", address: "서울 강남구 테헤란로", description: "30년 전통의 종합 건설사" },
  { email: "company2@demo.com", name: "테크파크건설", company_name: "테크파크건설", biz_number: "234-56-78901", ceo: "이테크", industry: "IT건설", employees: "80명", address: "경기 성남시 판교", description: "IT빌딩 전문 건설/관리" },
];

export async function POST() {
  const supabase = getAdminClient();
  const results: string[] = [];

  // 1. 기존 고아 프로필 정리 (auth.users 없이 profiles만 있는 데이터)
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

  // 관련 하위 테이블 먼저 삭제 (FK 제약)
  await supabase.from("worker_profiles").delete().in("id", oldIds);
  await supabase.from("company_profiles").delete().in("id", oldIds);
  await supabase.from("profiles").delete().in("id", oldIds);
  results.push("기존 고아 데이터 정리 완료");

  // 2. 기술자 데모 계정 생성
  for (const w of DEMO_WORKERS) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: w.email,
      password: "demo1234",
      email_confirm: true,
      user_metadata: { name: w.name, role: "worker" },
    });

    if (createError) {
      // 이미 존재하면 비밀번호 업데이트
      if (createError.message.includes("already") || createError.message.includes("exists")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users?.find((u) => u.email === w.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password: "demo1234" });
          await setupWorkerProfile(supabase, existing.id, w);
          results.push(`${w.email}: 기존 유저 업데이트 (${existing.id})`);
          continue;
        }
      }
      results.push(`${w.email}: 생성 실패 - ${createError.message}`);
      continue;
    }

    await setupWorkerProfile(supabase, newUser.user.id, w);
    results.push(`${w.email}: 새 유저 생성 (${newUser.user.id})`);
  }

  // 3. 기업 데모 계정 생성
  for (const c of DEMO_COMPANIES) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: c.email,
      password: "demo1234",
      email_confirm: true,
      user_metadata: { name: c.name, role: "company" },
    });

    if (createError) {
      if (createError.message.includes("already") || createError.message.includes("exists")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users?.find((u) => u.email === c.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password: "demo1234" });
          await setupCompanyProfile(supabase, existing.id, c);
          results.push(`${c.email}: 기존 유저 업데이트 (${existing.id})`);
          continue;
        }
      }
      results.push(`${c.email}: 생성 실패 - ${createError.message}`);
      continue;
    }

    await setupCompanyProfile(supabase, newUser.user.id, c);
    results.push(`${c.email}: 새 유저 생성 (${newUser.user.id})`);
  }

  // 4. 데모 공고 생성 (기업 계정 ID로)
  const { data: company1Profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "company1@demo.com")
    .single();

  if (company1Profile) {
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("company_id", company1Profile.id)
      .limit(1);

    if (!existingJobs || existingJobs.length === 0) {
      await supabase.from("jobs").insert([
        {
          company_id: company1Profile.id,
          title: "강남 오피스텔 배관 교체 공사",
          location: "서울 강남구",
          salary: "일 35만원",
          type: "단기 (2주)",
          description: "강남구 소재 오피스텔 30세대 배관 교체 작업입니다.",
          requirements: ["배관공 경력 5년 이상", "PVC 배관 시공 경험", "자격증 소지자 우대"],
          benefits: ["중식 제공", "주차 가능", "안전장비 지급"],
          applicant_count: 12,
          status: "active",
        },
        {
          company_id: company1Profile.id,
          title: "서초 아파트 난방 배관 공사",
          location: "서울 서초구",
          salary: "일 40만원",
          type: "단기 (1주)",
          description: "서초구 아파트 단지 난방 배관 교체 작업.",
          requirements: ["난방배관 경력 3년 이상", "자격증 우대"],
          benefits: ["식대 제공", "교통비 지원"],
          applicant_count: 5,
          status: "active",
        },
      ]);
      results.push("데모 공고 2건 생성 완료");
    } else {
      results.push("데모 공고 이미 존재");
    }
  }

  return NextResponse.json({ success: true, results });
}

async function setupWorkerProfile(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  w: DemoWorker
) {
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

async function setupCompanyProfile(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  c: DemoCompany
) {
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
