import { requireRole } from "@/lib/supabase/middleware";
import { applicationSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const body = await req.json();
  const parsed = applicationSchema.safeParse({ ...body, job_id: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("applications")
    .insert({
      job_id: id,
      worker_id: user!.id,
      message: parsed.data.message,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "이미 지원한 공고입니다" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
