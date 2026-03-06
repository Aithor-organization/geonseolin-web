import { requireRole } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

// 기업이 지원 수락/거절
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { status } = await req.json();
  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "유효하지 않은 상태입니다" }, { status: 400 });
  }

  // 해당 지원 조회
  const { data: application } = await supabase
    .from("applications")
    .select("id, job_id")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "지원을 찾을 수 없습니다" }, { status: 404 });
  }

  // 공고 소유권 확인
  const { data: job } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("id", application.job_id)
    .single();

  if (!job || job.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
