import { requireRole } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, user, supabase } = await requireRole("company");
  if (error) return error;

  const { data } = await supabase
    .from("company_bot_settings")
    .select("total_responses, total_escalations")
    .eq("company_id", user!.id)
    .single();

  return NextResponse.json({
    total_responses: data?.total_responses ?? 0,
    total_escalations: data?.total_escalations ?? 0,
  });
}
