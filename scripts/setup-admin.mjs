#!/usr/bin/env node
/**
 * 관리자 계정 생성 + 역할 CHECK 제약 업데이트 스크립트
 * 사용법: node scripts/setup-admin.mjs
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
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data };
  return { data, error: null };
}

async function testLogin(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );
  return res.json();
}

async function main() {
  console.log("🔧 관리자 시스템 설정\n");

  // 1단계: profiles 테이블 CHECK 제약 업데이트
  console.log("1️⃣ 역할 제약 업데이트 (admin 추가)...");
  const { error: constraintErr } = await supabase.rpc("exec_sql", {
    sql: `
      DO $$
      BEGIN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
          CHECK (role IN ('worker', 'company', 'admin'));
      END $$;
    `,
  });

  if (constraintErr) {
    // rpc가 없으면 직접 SQL 실행 시도 (서비스 클라이언트)
    console.log("  ⚠️ rpc 실패, REST로 제약 변경 시도...");
    const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
          ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
            CHECK (role IN ('worker', 'company', 'admin'));
        `,
      }),
    });
    if (!sqlRes.ok) {
      console.log(
        "  ⚠️ 자동 제약 변경 실패 - Supabase Dashboard SQL Editor에서 수동 실행 필요:"
      );
      console.log(
        "     ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;"
      );
      console.log(
        "     ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check"
      );
      console.log("       CHECK (role IN ('worker', 'company', 'admin'));");
    } else {
      console.log("  ✅ 역할 제약 업데이트 완료");
    }
  } else {
    console.log("  ✅ 역할 제약 업데이트 완료");
  }

  // 2단계: 관리자 계정 생성
  console.log("\n2️⃣ 관리자 계정 생성...");
  const ADMIN_EMAIL = "admin@geonseolin.kr";
  const ADMIN_PASSWORD = "admin1234!";

  const { data: adminUser, error: adminErr } = await gotrueAdmin(
    "POST",
    "/users",
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "관리자", role: "admin" },
    }
  );

  if (adminErr) {
    if (adminErr.msg && adminErr.msg.includes("already")) {
      console.log(`  ⏩ ${ADMIN_EMAIL}: 이미 존재`);
      const loginRes = await testLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
      if (loginRes.user) {
        await setupAdminProfile(loginRes.user.id);
        console.log(`     프로필 업데이트: ${loginRes.user.id}`);
      }
    } else {
      console.log(
        `  ❌ ${ADMIN_EMAIL}: ${adminErr.msg || JSON.stringify(adminErr)}`
      );
    }
  } else {
    console.log(`  ✅ ${ADMIN_EMAIL}: ${adminUser.id}`);
    await setupAdminProfile(adminUser.id);
  }

  // 3단계: 로그인 테스트
  console.log("\n3️⃣ 관리자 로그인 테스트...");
  const result = await testLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (result.access_token) {
    console.log(`  ✅ ${ADMIN_EMAIL}: 로그인 성공`);
  } else {
    console.log(
      `  ❌ ${ADMIN_EMAIL}: ${result.msg || result.error_description || "실패"}`
    );
  }

  console.log("\n🎉 관리자 설정 완료!");
  console.log(`   관리자: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("   관리자 페이지: /admin");
  console.log(
    "\n⚠️ 프로덕션 배포 시 비밀번호를 반드시 변경하세요!"
  );
  console.log(
    "⚠️ CHECK 제약 변경 실패 시 Supabase Dashboard SQL Editor에서 수동 실행 필요"
  );
}

async function setupAdminProfile(userId) {
  await supabase.from("profiles").upsert(
    {
      id: userId,
      role: "admin",
      name: "관리자",
      email: "admin@geonseolin.kr",
    },
    { onConflict: "id" }
  );
  await supabase
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id" });
}

main().catch(console.error);
