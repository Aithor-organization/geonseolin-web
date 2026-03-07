import { requireRole } from "@/lib/supabase/middleware";
import { companyBotSettingsSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { data } = await supabase
    .from("company_bot_settings")
    .select("*")
    .eq("company_id", user!.id)
    .single();

  return NextResponse.json(data ?? {
    enabled: false,
    schedule_mode: "always",
    tone: "polite",
    escalation_keywords: ["급여", "계약", "불만", "사고", "보험"],
    notify_on_escalation: true,
  });
}

export async function PUT(req: NextRequest) {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const body = await req.json();
  const parsed = companyBotSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from("company_bot_settings")
    .upsert({
      company_id: user!.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "company_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
