import { requireRole } from "@/lib/supabase/middleware";
import { autoApplySettingsSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const { data } = await supabase
    .from("auto_apply_settings")
    .select("*")
    .eq("worker_id", user!.id)
    .single();

  return NextResponse.json(data ?? {
    enabled: false,
    max_daily_applications: 3,
    apply_time: "09:00",
    preferred_locations: [],
    min_daily_rate: 0,
    job_types: [],
    exclude_keywords: [],
    templates: [],
    active_template_id: null,
  });
}

export async function PUT(req: NextRequest) {
  const { error, user, supabase } = await requireRole("worker");
  if (error) return error;

  const body = await req.json();
  const parsed = autoApplySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from("auto_apply_settings")
    .upsert({
      worker_id: user!.id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "worker_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
