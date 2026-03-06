import { requireRole } from "@/lib/supabase/middleware";
import { workerCertificateSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { data } = await supabase
    .from("worker_certificates")
    .select("*")
    .eq("worker_id", user!.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const body = await req.json();
  const parsed = workerCertificateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("worker_certificates")
    .insert({ worker_id: user!.id, ...parsed.data })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
  }

  await supabase
    .from("worker_certificates")
    .delete()
    .eq("id", id)
    .eq("worker_id", user!.id);

  return NextResponse.json({ success: true });
}
