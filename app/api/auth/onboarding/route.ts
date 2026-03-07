import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
});

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 이미 프로필이 있는지 확인
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "이미 프로필이 존재합니다" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name } = parsed.data;

  // OAuth 사용자는 항상 기술자(worker)로 생성
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      role: "worker",
      name,
      email: user.email ?? "",
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await supabase.from("worker_profiles").insert({ id: user.id });

  return NextResponse.json({ success: true, role: "worker" });
}
