import { getSupabaseServerClient } from "@/lib/supabase/server";
import { companyRegisterSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 기술자 계정인지 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "worker") {
    return NextResponse.json({ error: "기술자 계정만 기업 등록을 신청할 수 있습니다" }, { status: 403 });
  }

  // 이미 기업 신청이 있는지 확인
  const { data: existing } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existing) {
    const existingStatus = (existing as Record<string, unknown>).approval_status;
    if (existingStatus === "pending") {
      return NextResponse.json({ error: "이미 기업 등록 신청이 진행 중입니다" }, { status: 409 });
    }
    if (existingStatus === "approved") {
      return NextResponse.json({ error: "이미 기업으로 승인되었습니다" }, { status: 409 });
    }
    // rejected인 경우 재신청 허용 - 기존 데이터 삭제 후 새로 생성
    await supabase.from("company_profiles").delete().eq("id", user.id);
  }

  const body = await req.json();
  const parsed = companyRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { company_name, biz_number, ceo, industry, address } = parsed.data;

  // company_profiles에 pending 상태로 생성
  const { error: insertError } = await (supabase.from("company_profiles") as ReturnType<typeof supabase.from>)
    .insert({
      id: user.id,
      company_name,
      biz_number,
      ceo,
      industry: industry ?? null,
      address: address ?? null,
      approval_status: "pending",
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "pending" });
}

// 내 기업 등록 상태 확인
export async function GET() {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { data } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) {
    return NextResponse.json({ application: null });
  }

  const record = data as Record<string, unknown>;
  return NextResponse.json({
    application: {
      approval_status: record.approval_status,
      company_name: record.company_name,
      biz_number: record.biz_number,
      rejection_reason: record.rejection_reason,
    },
  });
}
