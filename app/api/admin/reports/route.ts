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

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // reports 테이블이 아직 타입에 없을 수 있으므로 캐스팅
  let query = (supabase
    .from("reports") as any)
    .select("*", { count: "exact" });

  if (status && ["pending", "resolved", "dismissed"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false });

  if (error) {
    // 테이블이 없으면 빈 배열 반환
    return NextResponse.json({ reports: [], total: 0 });
  }

  return NextResponse.json({
    reports: data ?? [],
    total: count ?? 0,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!(await checkAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { reportId, status } = body as { reportId: string; status: string };

  if (!reportId || !status) {
    return NextResponse.json({ error: "reportId and status required" }, { status: 400 });
  }

  const validStatuses = ["pending", "resolved", "dismissed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates: { status: "pending" | "resolved" | "dismissed"; resolved_at?: string } = {
    status: status as "pending" | "resolved" | "dismissed",
  };
  if (status === "resolved" || status === "dismissed") {
    updates.resolved_at = new Date().toISOString();
  }

  // reports 테이블이 아직 타입에 없을 수 있으므로 캐스팅
  const { error } = await (supabase
    .from("reports") as any)
    .update(updates)
    .eq("id", reportId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
