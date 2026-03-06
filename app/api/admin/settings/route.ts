import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function checkAdmin(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (profile?.role as string) === "admin" || user.user_metadata?.role === "admin";
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // platform_settings 테이블이 아직 타입에 없을 수 있으므로 캐스팅
  const { data, error } = await (supabase
    .from("platform_settings") as any)
    .select("*")
    .eq("id", "default")
    .single();

  if (error) {
    // 테이블이 없으면 기본값 반환
    return NextResponse.json({
      fee_rate: 5,
      min_daily_rate: 150000,
      auto_match: false,
    });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { fee_rate, min_daily_rate, auto_match } = body as {
    fee_rate?: number;
    min_daily_rate?: number;
    auto_match?: boolean;
  };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fee_rate !== undefined) updates.fee_rate = fee_rate;
  if (min_daily_rate !== undefined) updates.min_daily_rate = min_daily_rate;
  if (auto_match !== undefined) updates.auto_match = auto_match;

  const { error } = await (supabase
    .from("platform_settings") as any)
    .update(updates)
    .eq("id", "default");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
