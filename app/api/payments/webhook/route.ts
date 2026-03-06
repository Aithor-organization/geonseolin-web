import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/payments/toss";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("toss-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const { paymentKey, status } = event;

  const supabase = await getSupabaseServiceClient();

  // paymentKey로 결제 레코드 조회 후 상태 업데이트
  const statusMap: Record<string, string> = {
    DONE: "completed",
    CANCELED: "refunded",
    EXPIRED: "failed",
    ABORTED: "failed",
  };

  const mappedStatus = (statusMap[status] ?? "processing") as "pending" | "processing" | "completed" | "failed" | "refunded";

  await supabase
    .from("payments")
    .update({ toss_status: status, status: mappedStatus })
    .eq("payment_key", paymentKey);

  return NextResponse.json({ success: true });
}
