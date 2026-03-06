import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

// 계약서 디지털 서명
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

  if (contract.status !== "pending") {
    return NextResponse.json({ error: "대기 상태의 계약만 서명할 수 있습니다" }, { status: 400 });
  }

  const isWorker = contract.worker_id === user!.id;
  const isCompany = contract.company_id === user!.id;

  if (!isWorker && !isCompany) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const updateField = isWorker ? "signed_by_worker" : "signed_by_company";

  const updates: Record<string, any> = { [updateField]: true };

  // 양측 모두 서명 시 계약 체결 + signed_at 기록
  const otherSigned = isWorker ? contract.signed_by_company : contract.signed_by_worker;
  if (otherSigned) {
    updates.signed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, both_signed: !!otherSigned });
}
