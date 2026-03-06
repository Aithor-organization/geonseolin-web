import { requireRole } from "@/lib/supabase/middleware";
import { jobSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { data, error: fetchError } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", user!.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("jobs")
    .insert({ ...parsed.data, company_id: user!.id })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
