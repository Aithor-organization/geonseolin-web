import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

// login_attempts 테이블 조회 (테이블 미존재 시 null 반환)
async function getLoginAttempts(serviceClient: any, email: string) {
  try {
    const { data, error } = await (serviceClient as any)
      .from("login_attempts")
      .select("*")
      .eq("email", email)
      .order("last_attempt_at", { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  } catch {
    // 테이블이 없거나 DB 오류 → brute force 보호 없이 진행
    return null;
  }
}

// login_attempts 업데이트 (실패해도 로그인 흐름에 영향 없음)
async function updateLoginAttempts(
  serviceClient: any,
  attempts: any,
  email: string,
  ip: string,
  updates: Record<string, any>
) {
  try {
    if (attempts) {
      await (serviceClient as any)
        .from("login_attempts")
        .update({ ...updates, ip_address: ip })
        .eq("id", attempts.id);
    } else {
      await (serviceClient as any)
        .from("login_attempts")
        .insert({ email, ip_address: ip, ...updates });
    }
  } catch {
    // DB 오류 시 무시 — 로그인 흐름 영향 없음
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // 잠금 상태 확인 (service role로 RLS 우회)
  let serviceClient: any;
  try {
    serviceClient = await getSupabaseServiceClient();
  } catch {
    // service client 생성 실패 시 brute force 보호 없이 진행
    serviceClient = null;
  }

  const attempts = serviceClient ? await getLoginAttempts(serviceClient, email) : null;

  if (attempts?.locked_until && new Date(attempts.locked_until) > new Date()) {
    const remaining = Math.ceil(
      (new Date(attempts.locked_until).getTime() - Date.now()) / 60000
    );
    return NextResponse.json(
      { error: `계정이 잠겼습니다. ${remaining}분 후 다시 시도해주세요.` },
      { status: 429 }
    );
  }

  // 로그인 시도
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // 실패 횟수 기록
    const newCount = (attempts?.attempt_count ?? 0) + 1;
    const lockUntil = newCount >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
      : null;

    if (serviceClient) {
      await updateLoginAttempts(serviceClient, attempts, email, ip, {
        attempt_count: newCount,
        last_attempt_at: new Date().toISOString(),
        locked_until: lockUntil,
      });
    }

    if (lockUntil) {
      return NextResponse.json(
        { error: `${MAX_ATTEMPTS}회 실패로 계정이 ${LOCK_MINUTES}분간 잠겼습니다.` },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `이메일 또는 비밀번호가 올바르지 않습니다. (${newCount}/${MAX_ATTEMPTS})` },
      { status: 401 }
    );
  }

  // 성공 시 시도 횟수 초기화
  if (serviceClient && attempts) {
    await updateLoginAttempts(serviceClient, attempts, email, ip, {
      attempt_count: 0,
      locked_until: null,
    });
  }

  return NextResponse.json({ user: data.user, session: data.session });
}
