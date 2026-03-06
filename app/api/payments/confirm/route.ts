import { requireAuth } from "@/lib/supabase/middleware";
import { confirmPayment } from "@/lib/payments/toss";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const { paymentKey, orderId, amount, contractId } = await req.json();
  if (!paymentKey || !orderId || !amount || !contractId) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다" }, { status: 400 });
  }

  // 계약 확인
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, total_amount, company_id")
    .eq("id", contractId)
    .single();

  if (!contract) {
    return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
  }
  if (contract.total_amount !== amount) {
    return NextResponse.json({ error: "결제 금액이 계약 금액과 다릅니다" }, { status: 400 });
  }

  try {
    const result = await confirmPayment(paymentKey, orderId, amount);

    // 결제 기록 저장
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        contract_id: contractId,
        amount,
        method: "escrow",
        status: "processing",
        payment_key: paymentKey,
        order_id: orderId,
        toss_status: result.status,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 계약 상태를 active로 변경
    await supabase
      .from("contracts")
      .update({ status: "active" })
      .eq("id", contractId);

    return NextResponse.json(payment);
  } catch (err) {
    const message = err instanceof Error ? err.message : "결제 확인에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
