import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: fetchError } = await supabase
    .from("contracts")
    .select("*, jobs(title, location), worker_profiles(id, profiles!inner(name)), company_profiles(id, profiles!inner(name))")
    .eq("id", id)
    .or(`worker_id.eq.${user!.id},company_id.eq.${user!.id}`)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "계약을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const { status } = await req.json();
  const validStatuses = ["pending", "active", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "유효하지 않은 상태입니다" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("contracts")
    .update({ status })
    .eq("id", id)
    .or(`worker_id.eq.${user!.id},company_id.eq.${user!.id}`);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
