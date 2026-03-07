import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// admin 인증 헬퍼
async function verifyAdmin(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin =
    (profile?.role as string) === "admin" ||
    user.user_metadata?.role === "admin";

  return isAdmin ? user : null;
}

// 기업 승인 대기 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "15", 10)));

  const { data, count } = await supabase
    .from("company_profiles")
    .select(
      "*, profiles(name, email, avatar_url, created_at)",
      { count: "exact" }
    )
    .order("id", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  // approval_status 필터 (DB 타입에 아직 없으므로 JS에서 필터)
  const filtered = (data ?? []).filter(
    (item) => (item as Record<string, unknown>).approval_status === status
  );

  const total = status === "pending" ? filtered.length : (count ?? 0);

  return NextResponse.json({
    applications: filtered,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// 기업 승인/반려 처리
export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { user_id, action, reason } = body as {
    user_id: string;
    action: "approve" | "reject";
    reason?: string;
  };

  if (!user_id || !action) {
    return NextResponse.json({ error: "user_id와 action이 필요합니다" }, { status: 400 });
  }

  // 해당 신청이 pending인지 확인
  const { data: application } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", user_id)
    .single();

  const appStatus = (application as Record<string, unknown> | null)?.approval_status;
  if (!application || appStatus !== "pending") {
    return NextResponse.json({ error: "대기 중인 신청이 없습니다" }, { status: 404 });
  }

  if (action === "approve") {
    // company_profiles 승인 처리
    await (supabase.from("company_profiles") as ReturnType<typeof supabase.from>)
      .update({
        approval_status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
      })
      .eq("id", user_id);

    // profiles.role을 company로 변경
    await supabase
      .from("profiles")
      .update({ role: "company" })
      .eq("id", user_id);

    return NextResponse.json({ success: true, status: "approved" });
  } else {
    // 반려 처리
    await (supabase.from("company_profiles") as ReturnType<typeof supabase.from>)
      .update({
        approval_status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        rejection_reason: reason ?? null,
      })
      .eq("id", user_id);

    return NextResponse.json({ success: true, status: "rejected" });
  }
}
