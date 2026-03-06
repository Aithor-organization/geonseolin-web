#!/usr/bin/env node
/**
 * Auth 복구 + 데모 계정 생성 스크립트
 * 손상된 auth.users의 이메일과 겹치지 않는 새 이메일 사용
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (t === "" || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function gotrueAdmin(method, path, body) {
  const url = `${SUPABASE_URL}/auth/v1/admin${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data };
  return { data, error: null };
}

async function testLogin(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// 새 이메일 (손상된 레코드와 겹치지 않음)
const DEMO_WORKERS = [
  { email: "demo.worker1@test.com", name: "김철수", specialty: "배관공", experience: 15, bio: "15년 경력의 배관 전문가입니다.", location: "서울 강남구", hourly_rate: 45000, skills: ["수도배관","난방배관","가스배관","누수수리"], rating: 4.8, review_count: 127, completed_jobs: 342 },
  { email: "demo.worker2@test.com", name: "이영희", specialty: "전기기사", experience: 10, bio: "전기기사 1급 자격증 보유.", location: "서울 서초구", hourly_rate: 50000, skills: ["내선공사","조명설치","분전반","접지공사"], rating: 4.9, review_count: 89, completed_jobs: 256 },
];

const DEMO_COMPANIES = [
  { email: "demo.company1@test.com", name: "한양건설", company_name: "한양건설", biz_number: "123-45-67890", ceo: "김한양", industry: "종합건설", employees: "150명", address: "서울 강남구 테헤란로", description: "30년 전통의 종합 건설사" },
  { email: "demo.company2@test.com", name: "테크파크건설", company_name: "테크파크건설", biz_number: "234-56-78901", ceo: "이테크", industry: "IT건설", employees: "80명", address: "경기 성남시 판교", description: "IT빌딩 전문 건설/관리" },
];

async function main() {
  console.log("🔧 데모 계정 생성 (새 이메일)\n");

  // 1단계: 데모 기술자 생성
  console.log("1️⃣ 데모 기술자 생성...");
  for (const w of DEMO_WORKERS) {
    const { data: user, error } = await gotrueAdmin("POST", "/users", {
      email: w.email,
      password: "demo1234",
      email_confirm: true,
      user_metadata: { name: w.name, role: "worker" },
    });

    if (error) {
      // 이미 존재하면 스킵
      if (error.msg && error.msg.includes("already")) {
        console.log(`  ⏩ ${w.email}: 이미 존재 - 스킵`);
        // profiles 업데이트만 시도
        const loginRes = await testLogin(w.email, "demo1234");
        if (loginRes.user) {
          await setupWorkerProfile(loginRes.user.id, w);
          console.log(`     프로필 업데이트: ${loginRes.user.id}`);
        }
        continue;
      }
      console.log(`  ❌ ${w.email}: ${error.msg || JSON.stringify(error)}`);
      continue;
    }

    console.log(`  ✅ ${w.email}: ${user.id}`);
    await setupWorkerProfile(user.id, w);
  }
  console.log("");

  // 2단계: 데모 기업 생성
  console.log("2️⃣ 데모 기업 생성...");
  for (const c of DEMO_COMPANIES) {
    const { data: user, error } = await gotrueAdmin("POST", "/users", {
      email: c.email,
      password: "demo1234",
      email_confirm: true,
      user_metadata: { name: c.name, role: "company" },
    });

    if (error) {
      if (error.msg && error.msg.includes("already")) {
        console.log(`  ⏩ ${c.email}: 이미 존재 - 스킵`);
        const loginRes = await testLogin(c.email, "demo1234");
        if (loginRes.user) {
          await setupCompanyProfile(loginRes.user.id, c);
          console.log(`     프로필 업데이트: ${loginRes.user.id}`);
        }
        continue;
      }
      console.log(`  ❌ ${c.email}: ${error.msg || JSON.stringify(error)}`);
      continue;
    }

    console.log(`  ✅ ${c.email}: ${user.id}`);
    await setupCompanyProfile(user.id, c);
  }
  console.log("");

  // 3단계: 데모 공고 생성
  console.log("3️⃣ 데모 공고 생성...");
  const { data: company1 } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "demo.company1@test.com")
    .single();

  if (company1) {
    await supabase.from("jobs").delete().eq("company_id", company1.id);
    const { error: jobErr } = await supabase.from("jobs").insert([
      {
        company_id: company1.id,
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
        company_id: company1.id,
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
    if (jobErr) console.log(`  ⚠️ ${jobErr.message}`);
    else console.log("  ✅ 데모 공고 2건 생성");
  } else {
    console.log("  ⚠️ company1 프로필 없음 - 공고 스킵");
  }

  // 4단계: 로그인 테스트
  console.log("\n4️⃣ 로그인 테스트...");
  for (const email of ["demo.worker1@test.com", "demo.company1@test.com"]) {
    const result = await testLogin(email, "demo1234");
    if (result.access_token) {
      console.log(`  ✅ ${email}: 로그인 성공`);
    } else {
      console.log(`  ❌ ${email}: ${result.msg || result.error_description || "실패"}`);
    }
  }

  console.log("\n🎉 데모 계정 생성 완료!");
  console.log("   기술자: demo.worker1@test.com / demo1234");
  console.log("   기업: demo.company1@test.com / demo1234");
  console.log("\n⚠️ 로그인 페이지의 데모 버튼 이메일도 업데이트 필요");
}

async function setupWorkerProfile(userId, w) {
  await supabase.from("profiles").upsert(
    { id: userId, role: "worker", name: w.name, email: w.email },
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
  await supabase.from("user_settings").upsert({ user_id: userId }, { onConflict: "user_id" });
}

async function setupCompanyProfile(userId, c) {
  await supabase.from("profiles").upsert(
    { id: userId, role: "company", name: c.name, email: c.email },
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
  await supabase.from("user_settings").upsert({ user_id: userId }, { onConflict: "user_id" });
}

main().catch(console.error);
