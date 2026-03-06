import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // 잠금 상태 확인 (service role로 RLS 우회)
  const serviceClient = await getSupabaseServiceClient();
  // login_attempts 테이블은 types.ts에 미포함 — any 캐스트 필요
  const { data: attempts } = await (serviceClient as any)
    .from("login_attempts")
    .select("*")
    .eq("email", email)
    .order("last_attempt_at", { ascending: false })
    .limit(1)
    .single() as { data: any };

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

    if (attempts) {
      await (serviceClient as any)
        .from("login_attempts")
        .update({
          attempt_count: newCount,
          last_attempt_at: new Date().toISOString(),
          locked_until: lockUntil,
          ip_address: ip,
        })
        .eq("id", attempts.id);
    } else {
      await (serviceClient as any)
        .from("login_attempts")
        .insert({
          email,
          ip_address: ip,
          attempt_count: newCount,
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
  if (attempts) {
    await (serviceClient as any)
      .from("login_attempts")
      .update({ attempt_count: 0, locked_until: null })
      .eq("id", attempts.id);
  }

  return NextResponse.json({ user: data.user, session: data.session });
}
