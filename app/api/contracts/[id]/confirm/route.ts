import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

// 작업 완료 확인 (기술자/기업 각각)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
  }

  if (contract.status !== "active") {
    return NextResponse.json({ error: "진행 중인 계약만 완료 확인할 수 있습니다" }, { status: 400 });
  }

  const isWorker = contract.worker_id === user!.id;
  const isCompany = contract.company_id === user!.id;

  if (!isWorker && !isCompany) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const updateField = isWorker ? "worker_confirmed" : "company_confirmed";

  const { error: updateError } = await supabase
    .from("contracts")
    .update({ [updateField]: true })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 트리거가 양측 확인 시 자동으로 에스크로 해제
  return NextResponse.json({ success: true, confirmed: updateField });
}
