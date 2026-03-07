import { getSupabaseServerClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, password, name, phone, terms_agreed } = parsed.data;
  const supabase = await getSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "회원가입 실패" }, { status: 400 });
  }

  const userId = authData.user.id;

  // 모든 가입자는 기술자(worker)로 생성
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, role: "worker", name, email, phone: phone ?? null, terms_agreed });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await supabase.from("worker_profiles").insert({ id: userId });

  return NextResponse.json({ user: authData.user, session: authData.session });
}
