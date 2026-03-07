import { requireRole } from "@/lib/supabase/middleware";
import { botFaqSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = botFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("company_bot_faq")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", user!.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  await supabase
    .from("company_bot_faq")
    .delete()
    .eq("id", id)
    .eq("company_id", user!.id);

  return NextResponse.json({ success: true });
}
