import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: fetchError } = await supabase
    .from("payments")
    .select("*, contracts(worker_id, company_id, jobs(title))")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}
