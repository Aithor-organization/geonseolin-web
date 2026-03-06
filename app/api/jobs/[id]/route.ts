import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/middleware";
import { jobSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*, company_profiles!inner(company_name, address)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "공고를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // 소유권 확인
  const { data: job } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("id", id)
    .single();

  if (!job || job.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { data, error: updateError } = await supabase
    .from("jobs")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  // 소유권 확인
  const { data: job } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("id", id)
    .single();

  if (!job || job.company_id !== user!.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
