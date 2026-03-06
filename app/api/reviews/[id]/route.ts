import { requireAuth } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "리뷰를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, user, supabase } = await requireAuth();
  if (error) return error;

  const body = await req.json();

  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      rating: body.rating,
      categories: body.categories,
      comment: body.comment,
    })
    .eq("id", id)
    .eq("company_id", user!.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
