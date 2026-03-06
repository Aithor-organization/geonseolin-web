import { requireAuth } from "@/lib/supabase/middleware";
import { cancelPayment } from "@/lib/payments/toss";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const { reason } = await req.json();
  if (!reason) {
    return NextResponse.json({ error: "환불 사유를 입력해주세요" }, { status: 400 });
  }

  // Relationships: [] 이슈로 별도 쿼리
  const { data: payment } = await supabase
    .from("payments")
    .select("id, contract_id, payment_key, escrow_released")
    .eq("id", id)
    .single();

  if (!payment || !payment.contract_id) {
    return NextResponse.json({ error: "결제를 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, company_id")
    .eq("id", payment.contract_id)
    .single();

  if (!contract || contract.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  if (payment.escrow_released) {
    return NextResponse.json({ error: "이미 에스크로가 해제된 결제입니다" }, { status: 400 });
  }

  try {
    if (payment.payment_key) {
      await cancelPayment(payment.payment_key, reason);
    }

    await supabase
      .from("payments")
      .update({
        status: "refunded",
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", id);

    // 계약도 취소 처리
    await supabase
      .from("contracts")
      .update({ status: "cancelled" })
      .eq("id", contract.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
