import { requireRole } from "@/lib/supabase/middleware";
import { botFaqSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { data } = await supabase
    .from("company_bot_faq")
    .select("*")
    .eq("company_id", user!.id)
    .order("priority", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = botFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("company_bot_faq")
    .insert({ company_id: user!.id, ...parsed.data })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
