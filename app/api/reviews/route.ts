import { requireAuth, requireRole } from "@/lib/supabase/middleware";
import { reviewSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const workerId = req.nextUrl.searchParams.get("worker_id");
  const companyId = req.nextUrl.searchParams.get("company_id");

  let query = supabase
    .from("reviews")
    .select("*, profiles!reviews_company_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (workerId) query = query.eq("worker_id", workerId);
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("reviews")
    .insert({
      ...parsed.data,
      company_id: user!.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
