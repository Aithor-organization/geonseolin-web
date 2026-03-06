import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

// 에스크로 해제 (양측 작업 완료 확인 후)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  // Relationships: [] 이슈로 별도 쿼리
  const { data: payment } = await supabase
    .from("payments")
    .select("id, contract_id, escrow_released")
    .eq("id", id)
    .single();

  if (!payment || !payment.contract_id) {
    return NextResponse.json({ error: "결제를 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("worker_id, company_id, worker_confirmed, company_confirmed")
    .eq("id", payment.contract_id)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
  }

  // 해당 계약의 당사자인지 확인
  if (contract.worker_id !== user!.id && contract.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 양측 모두 확인 완료인지 체크
  if (!contract.worker_confirmed || !contract.company_confirmed) {
    return NextResponse.json({ error: "양측 모두 작업 완료를 확인해야 합니다" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("payments")
    .update({ escrow_released: true, status: "completed" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
